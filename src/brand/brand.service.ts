import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Brand } from './schemas/brand.schema';
import { Model } from 'mongoose';

@Injectable()
export class BrandService {
  constructor(@InjectModel(Brand.name) private brandModel: Model<Brand>) {}
  async create(createBrandDto: CreateBrandDto) {
    const brand = await this.brandModel.findOne({ name: createBrandDto.name });
    if (brand) {
      throw new BadRequestException('Brand already exist');
    }

    const newBrand = await this.brandModel.create(createBrandDto);
    return {
      message: 'Brand created successfully',
      data: newBrand,
    };
  }

  async findAll() {
    const brands = await this.brandModel.find().select('-__v');
    return {
      message: 'Brands found',
      length: brands.length,
      data: brands,
    };
  }

  async findOne(id: string) {
    const brand = await this.brandModel.findById(id).select('-__v');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      status: 200,
      message: 'Brand found',
      data: brand,
    };
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.brandModel.findById( id );
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    const updatedBrand = await this.brandModel.findByIdAndUpdate
    (id, updateBrandDto, { new: true });
    return {
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  async remove(id: string) {
    const brand = await this.brandModel.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    await this.brandModel.findByIdAndDelete(id);
    return {
      message: 'Brand deleted successfully',
    };
  }
}
