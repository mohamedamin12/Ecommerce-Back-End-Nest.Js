import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SubCategory } from './schemas/sub-category.schema';
import { Category } from 'src/category/schemas/category.schema';
import { Model } from 'mongoose';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}
  async create(subCreateCategoryDto: CreateSubCategoryDto) {
    const subCategory = await this.subCategoryModel.findOne({
      name: subCreateCategoryDto.name,
    });

    if (subCategory) {
      throw new BadRequestException('Sub Category already exist');
    }

    const category = await this.categoryModel.findById(
      subCreateCategoryDto.category,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const newSubCategory = await (
      await this.subCategoryModel.create(subCreateCategoryDto)
    ).populate('category', '-_id -__v');
    return {
      status: 200,
      message: 'Sub Category created successfully',
      data: newSubCategory,
    };
  }



  async findAll() {
    const subcategory = await this.subCategoryModel
      .find()
      .populate('category', '-_id -__v');
    return {
      message: 'Sub Categories found',
      length: subcategory.length,
      isEmpty: subcategory.length > 0 ? 'false' : 'true',
      data: subcategory,
    };
  }

  async findOne(_id: string) {
    const subCategory = await this.subCategoryModel
      .findOne({ _id })
      .select('-__v')
      .populate('category', '-_id -__v');
    if (!subCategory) {
      throw new NotFoundException('Sub Category not found');
    }

    return {
      message: 'Sub Category found',
      data: subCategory,
    };
  }

  async update(_id: string, UpdateSubCategoryDto: UpdateSubCategoryDto) {
    const subCategory = await this.subCategoryModel.findOne({ _id });
    if (!subCategory) {
      throw new NotFoundException('Sub Category not found');
    }

    const updatedSubCategory = await this.subCategoryModel
      .findByIdAndUpdate({ _id }, UpdateSubCategoryDto, { new: true })
      .select('-__v')
      .populate('category', '-_id -__v');

    return {
      status: 200,
      message: 'Sub Category updated successfully',
      data: updatedSubCategory,
    };
  }

  async remove(_id: string) {
    const subCategory = await this.subCategoryModel.findOne({ _id });
    if (!subCategory) {
      throw new NotFoundException('Sub Category not found');
    }
    await this.subCategoryModel.deleteOne({ _id });
    return {
      status: 200,
      message: 'Sub Category deleted successfully',
    };
  }
}
