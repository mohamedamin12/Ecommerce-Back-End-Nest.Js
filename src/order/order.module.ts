import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutCardController, OrderController, OrderForAdminController, OrderForUserController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, orderSchema } from './schemas/order.schema';
import { Cart, cartSchema } from 'src/cart/schemas/cart.schema';
import { Tax, taxSchema } from 'src/tax/schemas/tax.schema';
import { Product, productSchema } from 'src/product/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: orderSchema },
      { name: Cart.name, schema: cartSchema },
      { name: Tax.name, schema: taxSchema },
      { name: Product.name, schema: productSchema },
    ]),
  ],
  controllers: [OrderController , CheckoutCardController , OrderForUserController , OrderForAdminController],
  providers: [OrderService],
})
export class OrderModule {}
