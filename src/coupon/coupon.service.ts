import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon } from './schemas/coupon.schema';
import { Model } from 'mongoose';

@Injectable()
export class CouponService {
  constructor(@InjectModel(Coupon.name) private couponModule: Model<Coupon>) {}
  async create(createCouponDto: CreateCouponDto) {
    const brand = await this.couponModule.findOne({ name: createCouponDto.name });
    if (brand) {
      throw new BadRequestException('Coupon already exist');
    }

    const newCoupon = await this.couponModule.create(createCouponDto);
    return {
      message: 'Coupon created successfully',
      data: newCoupon,
    };
  }

  async findAll() {
    const coupons = await this.couponModule.find().select('-__v');
    return {
      message: 'Coupons found',
      length: coupons.length,
      data: coupons,
    };
  }

  async findOne(id: string) {
    const coupon = await this.couponModule.findById(id).select('-__v');
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      message: 'Coupon found',
      data: coupon,
    };
  }


  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.couponModule.findById(id).select('-__v');
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const updatedCoupon = await this.couponModule.findByIdAndUpdate(
      id,
      updateCouponDto,
      {
        new: true,
      },
    );
    return {
      message: 'Coupon updated successfully',
      data: updatedCoupon,
    };
  }

  async remove(id: string) {
    const coupon = await this.couponModule.findById(id).select('-__v');
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    const deleteCoupon = await this.couponModule.findByIdAndDelete(id);
    return {
      message: 'Coupon deleted successfully',
      data: deleteCoupon,
    }
  }
}
