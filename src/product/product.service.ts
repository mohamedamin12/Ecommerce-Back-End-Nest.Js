import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Category } from 'src/category/schemas/category.schema';
import { SubCategory } from 'src/sub-category/schemas/sub-category.schema';
import { Model } from 'mongoose';

@Injectable()
export class ProductService {
    constructor(
      @InjectModel(Product.name) private readonly productModel: Model<Product>,
      @InjectModel(Category.name)
      private readonly categoryModule: Model<Category>,
      @InjectModel(SubCategory.name)
      private readonly subCategoryModule: Model<SubCategory>,
    ) {}
    async create(createProductDto: CreateProductDto) {
      const product = await this.productModel.findOne({
        title: createProductDto.title,
      });
      const category = await this.categoryModule.findById(
        createProductDto.category,
      );
  
      if (product) {
        throw new BadRequestException('This Product already Exist');
      }
  
      if (!category) {
        throw new BadRequestException('This Category not Exist');
      }
  
      if (createProductDto.subCategory) {
        const subCategory = await this.subCategoryModule.findById(
          createProductDto.subCategory,
        );
        if (!subCategory) {
          throw new BadRequestException('This Sub Category not Exist');
        }
      }
      const priceAfterDiscount = createProductDto?.priceAfterDiscount || 0;
      if (createProductDto.price < priceAfterDiscount) {
        throw new BadRequestException(
          'Must be price After discount greater than price',
        );
      }
  
      const newProduct = await (
        await this.productModel.create(createProductDto)
      ).populate('category subCategory brand', '-__v');
      return {
        message: 'Product created successfully',
        data: newProduct,
      };
    }

    async findAll(query: any) {
      // 1) filter
      let requestQuery = { ...query };
      const removeQuery = [
        'page',
        'limit',
        'sort',
        'keyword',
        'fields',
      ];
      removeQuery.forEach((singleQuery) => {
        delete requestQuery[singleQuery];
      });
      requestQuery = JSON.parse(
        JSON.stringify(requestQuery).replace(
          /\b(gte|lte|lt|gt)\b/g,
          (match) => `$${match}`,
        ),
      );
  
      // 2) pagenation
      const page = query?.page || 1;
      const limit = query?.limit || 5;
      const skip = (page - 1) * limit;
  
      // 3) sorting
      let sort = query?.sort || 'asc';
      if (!['asc', 'desc'].includes(sort)) {
        throw new BadRequestException('Invalid sort');
      }
      // 4) fields
      let fields = query?.fields || ''; // description,title
      fields = fields.split(',').join(' ');
  
      // 5) search
      let findData = { ...requestQuery };
  
      if (query.keyword) {
        findData.$or = [
          { title: { $regex: query.keyword } },
          { description: { $regex: query.keyword } },
        ];
      }
      if (query.category) {
        findData.category = query.category.toString();
      }
  
      const products = await this.productModel
        .find(findData)
        .limit(limit)
        .skip(skip)
        .sort({ title: sort })
        .select(fields);
      return {
        message: 'Found Product',
        isEmpty: products.length > 0 ? 'false' : 'true',
        length: products.length,
        data: products,
      };
    }
  

    async findOne(id: string) {
      const product = await this.productModel
        .findById(id)
        .select('-__v')
        .populate('category subCategory brand', '-__v');
      if (!product) {
        throw new NotFoundException('Product Not Found');
      }
  
      return {
        message: 'Found a Product',
        data: product,
      };
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException('Product Not Found');
      }
      if (updateProductDto.category) {
        const category = await this.categoryModule.findById(
          updateProductDto.category,
        );
        if (!category) {
          throw new BadRequestException('This Category not Exist');
        }
      }
      if (updateProductDto.subCategory) {
        const subCategory = await this.subCategoryModule.findById(
          updateProductDto.subCategory,
        );
        if (!subCategory) {
          throw new BadRequestException('This Sub Category not Exist');
        }
      }
  
      if (product.quantity < (updateProductDto.sold ?? 0)) {
        throw new BadRequestException('This Quantity not available'); 
      }
  
      const price = updateProductDto?.price || product.price;
      const priceAfterDiscount =
        updateProductDto?.priceAfterDiscount || product.priceAfterDiscount;
      if (price < priceAfterDiscount) {
        throw new BadRequestException(
          'Must be price After discount greater than price',
        );
      }
  
      return {
        message: 'Product Updated successfully',
        data: await this.productModel
          .findByIdAndUpdate(id, updateProductDto, {
            new: true,
          })
          .select('-__v')
          .populate('category subCategory brand', '-__v'),
      };
    }
  

    async remove(id: string) {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException('Product Not Found');
      }
  
      await this.productModel.findByIdAndDelete(id);
      return {
        message: 'Product Deleted successfully'
      };
    }
}
