import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSuppliersDto } from './dto/create-supplier.dto';
import { UpdateSuppliersDto } from './dto/update-supplier.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Suppliers } from './schemas/suppliers.schema';
import { Model } from 'mongoose';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Suppliers.name) private suppliersModule: Model<Suppliers>,
  ) {}
  async create(createSuppliersDto: CreateSuppliersDto) {
    const supplier = await this.suppliersModule.findOne({
      name: createSuppliersDto.name,
    });
    if (supplier) {
      throw new BadRequestException('supplier already exist');
    }

    const newSupplier = await this.suppliersModule.create(createSuppliersDto);
    return {
      status: 200,
      message: 'Supplier created successfully',
      data: newSupplier,
    };
  }

  async findAll() {
    const suppliers = await this.suppliersModule.find().select('-__v');
    return {
      status: 200,
      message: 'Suppliers found',
      length: suppliers.length,
      data: suppliers,
    };
  }

  async findOne(id: string) {
    const supplier = await this.suppliersModule.findById(id).select('-__v');
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return {
      status: 200,
      message: 'Brand found',
      data: supplier,
    };
  }

  async update(id: string, updateSuppliersDto: UpdateSuppliersDto) {
    const supplier = await this.suppliersModule.findById(id).select('-__v');
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const updatedSupplier = await this.suppliersModule.findByIdAndUpdate(
      id,
      updateSuppliersDto,
      {
        new: true,
      },
    );
    return {
      status: 200,
      message: 'Supplier updated successfully',
      data: updatedSupplier,
    };
  }

  async remove(id: string) {
    const supplier = await this.suppliersModule.findById(id).select('-__v');
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    await this.suppliersModule.findByIdAndDelete(id);
    return {
      message: 'Supplier deleted successfully',
    };
  }
}
