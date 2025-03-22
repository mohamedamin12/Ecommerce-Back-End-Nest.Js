import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './schemas/category.schema';
import { Model } from 'mongoose';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryModel.findOne({
      name: createCategoryDto.name,
    });
    if (category) {
      throw new BadRequestException('Category already exists');
    }
    const newCategory = await this.categoryModel.create(createCategoryDto);
    return {
      message: 'Category created successfully',
      data: newCategory,
    };

  }

  async findAll() {
    const category = await this.categoryModel.find().select('-__v');
    return {
      message: 'Categories found',
      length: category.length,
      isEmpty: category.length > 0 ? 'false' : 'true',
      data: category,
    };
  }

  async findOne(_id: string) {
    const category = await this.categoryModel.findOne({ _id }).select('-__v');
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      status: 200,
      message: 'Category is found',
      data: category,
    };
  }
  async update(_id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findOne({ _id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate({ _id }, updateCategoryDto, { new: true })
      .select('-__v');

    return {
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  async remove(_id: string) {
    const category = await this.categoryModel.findOne({ _id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryModel.deleteOne({ _id });
    return {
      status: 200,
      message: 'Category deleted successfully',
    };
  }
}
