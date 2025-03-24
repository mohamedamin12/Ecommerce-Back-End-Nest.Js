import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController, ReviewDashboardController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, reviewSchema } from './schemas/review.schema';
import { Product, productSchema } from 'src/product/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Review.name,
        schema: reviewSchema,
      },
      {
        name: Product.name,
        schema: productSchema,
      },
    ]),
  ],
  controllers: [ReviewController , ReviewDashboardController],
  providers: [ReviewService],
})
export class ReviewModule {}
