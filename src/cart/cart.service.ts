import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from 'src/product/schemas/product.schema';
import { Cart } from './schemas/cart.schema';
import { Coupon } from 'src/coupon/schemas/coupon.schema';
import { Model } from 'mongoose';
import { UpdateCartItemsDto } from './dto/update-cart-items.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModule: Model<Cart>,
    @InjectModel(Product.name) private readonly productModule: Model<Product>,
    @InjectModel(Coupon.name) private readonly couponModule: Model<Coupon>,
  ) { }
  async create(product_id: string, user_id: string, isElse?: boolean) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price discount');

    const product = await this.productModule.findById(product_id);

    // not found this product
    if (!product) {
      throw new NotFoundException('Not Found Product');
    }

    // quantity=0
    if (product.quantity <= 0) {
      throw new NotFoundException('Not Found quantity on this product');
    }

    // if user have cart=> insert product (productId)
    if (cart) {
      // add first product=> insert product in cart
      const indexProduct = cart.cartItems.findIndex(
        (item) => item.productId._id.toString() === product_id.toString(),
      );
      if (indexProduct !== -1) {
        cart.cartItems[indexProduct].quantity += 1;
      } else {
        // eslint-disable-next-line
        // @ts-ignore
        cart.cartItems.push({ productId: product_id, color: '', quantity: 1 });
      }
      await cart.populate('cartItems.productId', 'price discount');

      let totalPriceAfterInsert = 0;
      let totalDiscountPriceAfterInsert = 0;

      cart.cartItems.map((item) => {
        totalPriceAfterInsert += item.quantity * item.productId.price;
        totalDiscountPriceAfterInsert +=
          item.quantity * item.productId.discount;
      });

      cart.totalPrice = totalPriceAfterInsert - totalDiscountPriceAfterInsert;

      await cart.save();
      if (isElse) {
        return cart;
      } else {
        return {
          message: 'Created Cart and Insert Product',
          data: cart,
        }
      }
    } else {
      // else user don't have cart=> create cart
      await this.cartModule.create({
        cartItems: [],
        totalPrice: 0,
        user: user_id,
      });
      const insertProduct = await this.create(
        product_id,
        user_id,
        (isElse = true),
      );
      return {
        message: 'Created Cart and Insert Product',
        data: insertProduct,
      }
    }
  }

 async applyCoupon(user_id: string, couponName: string) {
  const cart = await this.cartModule.findOne({ user: user_id });
  const coupon = await this.couponModule.findOne({ name: couponName });

  if (!cart) {
    throw new NotFoundException('Not Found Cart');
  }
  if (!coupon) {
    throw new BadRequestException('Invalid coupon');
  }

  const isExpired = new Date(coupon.expireDate) > new Date();
  if (!isExpired) {
    throw new BadRequestException('Invalid coupon');
  }

  
  const ifCouponAlreadyUsed = cart.coupons.findIndex(
    (item) => item.name === couponName,
  );
  if (ifCouponAlreadyUsed !== -1) {
    throw new BadRequestException('Coupon already used');
  }

  if (cart.totalPrice <= 0) {
    throw new BadRequestException('You have full discount');
  }

  cart.coupons.push({ name: coupon.name, couponId: coupon._id.toString() });
  cart.totalPrice = cart.totalPrice - coupon.discount;
  await cart.save();

  return {
    message: 'Coupon Applied successfully',
    data: cart,
  };

}

  async findOne(user_id: string) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price title description')
      .select('-__v');
    if (!cart) {
      throw new NotFoundException(
        `You don't have a cart please go to add products`,
      );
    }
    return {
      message: 'Found Cart',
      data: cart,
    };
  }

  async update(
    productId: string,
    user_id: string,
    updateCartItemsDto: UpdateCartItemsDto
  ) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate(
        'cartItems.productId',
        'price title description discount _id',
      );

    const product = await this.productModule.findById(productId);
    if (!product) {
      throw new NotFoundException('Not Found Product');
    }

    if (!cart) {
      const result = await this.create(productId, user_id);
      return result;
    }

    const indexProductUpdate = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );

    if (indexProductUpdate === -1) {
      throw new NotFoundException('Not Found any product in cart');
    }

    // update color
    if (updateCartItemsDto.color) {
      cart.cartItems[indexProductUpdate].color = updateCartItemsDto.color;
    }
    // update quantity
    if (updateCartItemsDto.quantity > product.quantity) {
      throw new NotFoundException('Not Found quantity on this product');
    }

    let totalPriceAfterUpdated = 0;
    let totalDiscountPriceAfterUpdate = 0;

    if (updateCartItemsDto.quantity) {
      cart.cartItems[indexProductUpdate].quantity = updateCartItemsDto.quantity;
      cart.cartItems.map((item) => {
        totalPriceAfterUpdated += item.quantity * item.productId.price;
        totalDiscountPriceAfterUpdate +=
          item.quantity * item.productId.discount;
      });
      cart.totalPrice = totalPriceAfterUpdated - totalDiscountPriceAfterUpdate;
    }

    await cart.save();
    return {
      message: 'Product Updated in Cart successfully',
      data: cart,
    };
  }

  async remove(productId: string, user_id: string) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate(
        'cartItems.productId',
        'price title description discount _id',
      );
    if (!cart) {
      throw new NotFoundException('Not Found Cart');
    }

    const indexProductUpdate = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );
    if (indexProductUpdate === -1) {
      throw new NotFoundException('Not Found any product in cart');
    }
    // eslint-disable-next-line
    // @ts-ignore
    cart.cartItems = cart.cartItems.filter(
      (item, index) => index !== indexProductUpdate,
    );
    
    let totalPriceAfterInsert = 0;
    let totalDiscountPriceAfterInsert = 0;

    cart.cartItems.map((item) => {
      totalPriceAfterInsert += item.quantity * item.productId.price;
      totalDiscountPriceAfterInsert +=
        item.quantity * item.productId.discount;
    });

    cart.totalPrice = totalPriceAfterInsert - totalDiscountPriceAfterInsert;
    await cart.save();
    return {
      message: 'Deleted Product in Cart successfully',
      data: cart,
    };

  }

  // ===== For Admin ======== \\
  async findOneForAdmin(userId: string) {
    const cart = await this.cartModule
      .findOne({ user: userId })
      .populate('cartItems.productId', 'price title description');
    if (!cart) {
      throw new NotFoundException('Not Found Cart');
    }
    return {
      message: 'Found Cart',
      data: cart,
    };
  }

  async findAllForAdmin() {
    const carts = await this.cartModule
      .find()
      .select('-__v')
      .populate(
        'cartItems.productId user coupons.couponId',
        'name email expireDate price title description',
      );
    return {
      message: 'Found All Carts',
      length: carts.length,
      data: carts,
    };
  }
}
