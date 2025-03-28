import { Injectable, NotFoundException } from '@nestjs/common';
import { AcceptOrderCashDto, CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Cart } from 'src/cart/schemas/cart.schema';
import { Tax } from 'src/tax/schemas/tax.schema';
import { Product } from 'src/product/schemas/product.schema';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';

const stripe = require('stripe')("sk_test_51QhtvGGDL9XvsevYG6KLVpZLtwtXKgxhZrPVVwWQJY5QdVAYlz1uv4uPlg0VFx1PYeZdXZCrlCyfJexFbVLXTqPc005dj6Qxog");

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Tax.name) private readonly taxModel: Model<Tax>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly mailService: MailerService,
  ) { }
  async create(
    user_id: string,
    paymentMethodType: 'card' | 'cash',
    createOrderDto: CreateOrderDto,
    dataAfterPayment: {
      success_url: string;
      cancel_url: string;
    },
  ) {
    const cart = await this.cartModel
      .findOne({ user: user_id })
      .populate('cartItems.productId user');
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    const tax = await this.taxModel.findOne({});
    // eslint-disable-next-line
    // @ts-ignore
    const shippingAddress = cart.user?.address
      ? // eslint-disable-next-line
      // @ts-ignore
      cart.user.address
      : createOrderDto.shippingAddress || false;

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    const taxPrice = (tax?.taxPrice as unknown as number) || 0;
    const shippingPrice = (tax?.shippingPrice as unknown as number) || 0;
    // eslint-disable-next-line prefer-const
    let data = {
      user: user_id,
      cartItems: cart.cartItems,
      taxPrice,
      shippingPrice,
      totalOrderPrice: cart.totalPrice + taxPrice + shippingPrice,
      paymentMethodType,
      shippingAddress,
    };

    if (paymentMethodType === 'cash') {
      // insert order in db
      const order = await this.orderModel.create({
        ...data,
        isPaid: data.totalOrderPrice === 0 ? true : false,
        paidAt: data.totalOrderPrice === 0 ? new Date() : null,
        isDelivered: false,
      });
      if (data.totalOrderPrice === 0) {
        cart?.cartItems.forEach(async (item) => {
          await this.productModel.findByIdAndUpdate(
            item.productId,
            { $inc: { quantity: -item.quantity, sold: item.quantity } },
            { new: true },
          );
        });
        // reset Cart
        await this.cartModel.findOneAndUpdate(
          { user: user_id },
          { cartItems: [], totalPrice: 0 },
        );
      }

      return {
        status: 200,
        message: 'Order created successfully',
        data: order,
      };
    }
    // call the payment gateway here (stripe, etc)
    const line_items = cart.cartItems.map(({ productId, color }) => {
      return {
        price_data: {
          currency: 'egp',
          unit_amount: Math.round(data.totalOrderPrice * 100),
          product_data: {
            // eslint-disable-next-line
            // @ts-ignore
            name: productId.title,
            // eslint-disable-next-line
            // @ts-ignore
            description: productId.description,
            // eslint-disable-next-line
            // @ts-ignore
            images: [productId.imageCover, ...productId.images],
            metadata: {
              color,
            },
          },
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: dataAfterPayment.success_url,
      cancel_url: dataAfterPayment.cancel_url,

      client_reference_id: user_id.toString(),
      // eslint-disable-next-line
      // @ts-ignore
      customer_email: cart.user.email,
      metadata: {
        address: data.shippingAddress,
      },
    });
    // insert order in db
    const order = await this.orderModel.create({
      ...data,
      sessionId: session.id,
      isPaid: false,
      isDelivered: false,
    });

    return {
      status: 200,
      message: 'Order created successfully',
      data: {
        url: session.url,
        success_url: `${session.success_url}?session_id=${session.id}`,
        cancel_url: session.cancel_url,
        expires_at: new Date(session.expires_at * 1000),
        sessionId: session.id,
        totalPrice: session.amount_total,
        data: order,
      },
    };
  }


  async updatePaidCash(orderId: string, updateOrderDto: AcceptOrderCashDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentMethodType !== 'cash') {
      throw new NotFoundException('This order not paid by cash');
    }

    if (order.isPaid) {
      throw new NotFoundException('Order already paid');
    }

    if (updateOrderDto.isPaid) {
      updateOrderDto.paidAt = new Date();
      const cart = await this.cartModel
        .findOne({ user: order.user.toString() })
        .populate('cartItems.productId user');
      cart?.cartItems.forEach(async (item) => {
        await this.productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: -item.quantity, sold: item.quantity } },
          { new: true },
        );
      });
      // reset Cart
      await this.cartModel.findOneAndUpdate(
        { user: order.user.toString() },
        { cartItems: [], totalPrice: 0 },
      );

    }

    if (updateOrderDto.isDelivered) {
      updateOrderDto.deliveredAt = new Date();
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { ...updateOrderDto },
      { new: true },
    );

    return {
      status: 200,
      message: 'Order updated successfully',
      data: updatedOrder,
    };

  }

  async updatePaidCard(payload: any, sig: any, endpointSecret: string) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const sessionId = event.data.object.id;

        const order = await this.orderModel.findOne({ sessionId });

        if (!order) {
          console.log(`Order not found for sessionId: ${sessionId}`);
          return;
        }

        order.isPaid = true;
        order.isDelivered = true;
        order.paidAt = new Date();
        order.deliveredAt = new Date();

        const cart = await this.cartModel
          .findOne({ user: order.user.toString() })
          .populate('cartItems.productId user');

        if (cart) {
          for (const item of cart.cartItems) {
            await this.productModel.findByIdAndUpdate(
              item.productId,
              { $inc: { quantity: -item.quantity, sold: item.quantity } },
              { new: true },
            );
          }

          await this.cartModel.findOneAndUpdate(
            { user: order.user.toString() },
            { cartItems: [], totalPrice: 0 },
          );

          await cart.save();
        }

        await order.save();
        console.log(`Order ${order._id} marked as paid and delivered.`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }


  async findAllOrdersOnUser(user_id: string) {
    const orders = await this.orderModel.find({ user: user_id });
    return {
      status: 200,
      message: 'Orders found',
      length: orders.length,
      data: orders,
    };
  }
  async findAllOrders() {
    const orders = await this.orderModel.find({});
    return {
      status: 200,
      message: 'Orders found',
      length: orders.length,
      data: orders,
    };
  }
}

