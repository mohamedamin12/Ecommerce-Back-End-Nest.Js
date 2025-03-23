import { Injectable } from '@nestjs/common';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Tax } from './schemas/tax.schema';
import { Model } from 'mongoose';

@Injectable()
export class TaxService {
  constructor(@InjectModel(Tax.name) private readonly texModel: Model<Tax>) {}

  async createOrUpdate(createTexDto: CreateTaxDto) {
    const tex = await this.texModel.findOne({});
    if (!tex) {
      // Create New Tax
      const newTex = await this.texModel.create(createTexDto);
      return {
        status: 200,
        message: 'Tax created successfully',
        data: newTex,
      };
    }
    // Update Tax
    const updateTex = await this.texModel
      .findOneAndUpdate({}, createTexDto, {
        new: true,
      })
      .select('-__v');
    return {
      message: 'Tax Updated successfully',
      data: updateTex,
    };
  }

  async find() {
    const tex = await this.texModel.findOne({}).select('-__v');

    return {
      message: 'Tax found successfully',
      data: tex,
    };
  }

  async reSet() {
    const tax = await this.texModel.findOneAndUpdate({}, { taxPrice: 0, shippingPrice: 0 });
    return {
      message: 'Tax reset successfully',
      data: tax,
    };
  }
}
