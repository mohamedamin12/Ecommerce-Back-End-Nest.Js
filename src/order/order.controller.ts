import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { AcceptOrderCashDto, CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { AuthGuard } from 'src/user/guard/Auth.guard';

@Controller('/cart/checkout')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }


  //  @docs   User Can Create Order and Checkout session
  //  @Route  POST /api/v1/cart/checkout/:paymentMethodType?success_url=https://ecommerce-nestjs.com&cancel_url=https://ecommerce-nestjs.com
  //  @access Private [User]
  @Post(':paymentMethodType')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(
    @Param('paymentMethodType') paymentMethodType: 'card' | 'cash', 
    @Body() createOrderDto: CreateOrderDto,
    @Req() req,
    @Query() query,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException('You are not allowed to access this route');
    }
    if (!['card', 'cash'].includes(paymentMethodType)) {
      throw new NotFoundException('No payment method found');
    }
    const {
      success_url = 'https://ecommerce-nestjs.com',
      cancel_url = 'https://ecommerce-nestjs.com',
    } = query;

    const dataAfterPayment = {
      success_url,
      cancel_url,
    };

    const user_id = req.user._id;
    return this.orderService.create( 
      user_id,
      paymentMethodType,
      createOrderDto,
      dataAfterPayment
    );
  }


  //  @docs   Admin Can Update Order payment cash
  //  @Route  PATCH /api/v1/cart/checkout/:orderId/cash
  //  @access Private [User]
  @Patch(':orderId/cash')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  updatePaidCash(
    @Param('orderId') orderId: string,
    @Body()
    updateOrderDto: AcceptOrderCashDto,
  ) {
    return this.orderService.updatePaidCash(orderId, updateOrderDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
