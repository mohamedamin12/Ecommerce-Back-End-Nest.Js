import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './schemas/review.schema';
import { Product } from 'src/product/schemas/product.schema';



@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModule: Model<Review>,
    @InjectModel(Product.name) private readonly productModule: Model<Product>,
  ) {}
  async create(createReviewDto: CreateReviewDto , user_id: string) {
    const review = await this.reviewModule.findOne({
      user: user_id,
      product: createReviewDto.product,
    });
    if (review) {
      throw new BadRequestException(
        'This User already Created Review On this Product',
      );
    }
    const newReview = await (
      await this.reviewModule.create({
        ...createReviewDto,
        user: user_id,
      })
    ).populate('product user', 'name email title description imageCover');

    const reviewsOnSingleProduct = await this.reviewModule
    .find({
      product: createReviewDto.product,
    }).select('rating');
    const ratingsQuantity = reviewsOnSingleProduct.length;
    if (ratingsQuantity > 0) {
      let totalRatings: number = 0;
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }
      const ratingsAverage = totalRatings / ratingsQuantity;
      await this.productModule.findByIdAndUpdate(createReviewDto.product, {
        ratingsAverage,
        ratingsQuantity,
      });
    }
    return {
      message: 'Review Created successfully',
      data: newReview,
    };
  }

  async findAll(product_id: string) {
    const review = await this.reviewModule
      .find({ product: product_id })
      .populate('user product', 'name email title')
      .select('-__v');
    return {
      message: 'Reviews Found',
      length: review.length,
      data: review,
    };
  }

  async findOne(user_id: string) {
    const review = await this.reviewModule
      .find({ user: user_id })
      .populate('user product', 'name role email title')
      .select('-__v');
    return {
      status: 200,
      message: 'Reviews Found',
      length: review.length,
      data: review,
    };
  }


  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    user_id: string,
  ) {
    const findReview = await this.reviewModule.findById(id);

    if (!findReview) {
      throw new NotFoundException('Not Found Review On this Id');
    }

    if (user_id.toString() !== findReview.user.toString()) {
      throw new UnauthorizedException('You are not allowed to update review');
    }

    const updateReview = await this.reviewModule
      .findByIdAndUpdate(
        id,
        {
          ...updateReviewDto,
          user: user_id,
          product: updateReviewDto.product,
        },
        { new: true },
      ).select('-__v');
    // Rating in product module

    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: findReview.product,
      }).select('rating');
    const ratingsQuantity = reviewsOnSingleProduct.length;

    if (ratingsQuantity > 0) {
      let totalRatings: number = 0;
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }
      const ratingsAverage = totalRatings / ratingsQuantity;
      await this.productModule.findByIdAndUpdate(findReview.product, {
        ratingsAverage,
        ratingsQuantity,
      });
    }

    return {
      message: 'Review Updated successfully',
      data: updateReview,
    };
  }


  async remove(id: string, user_id: string) {
    const findReview = await this.reviewModule.findById(id);

    if (!findReview) {
      throw new NotFoundException('Not Found Review On this Id');
    }
    if (user_id.toString() !== findReview.user.toString()) {
      throw new UnauthorizedException();
    }
    await this.reviewModule.findByIdAndDelete(id);
    // Rating in product module
    // Rating in product module

    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: findReview.product,
      })
      .select('rating');
    const ratingsQuantity = reviewsOnSingleProduct.length;
    if (ratingsQuantity > 0) {
      let totalRatings: number = 0;
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }
      const ratingsAverage = totalRatings / ratingsQuantity;

      await this.productModule.findByIdAndUpdate(findReview.product, {
        ratingsAverage,
        ratingsQuantity,
      });
    }
    return {
      message : "review deleted successfully", 
    }
  }
}
