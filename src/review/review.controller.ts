import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { AuthGuard } from 'src/user/guard/Auth.guard';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  //  @docs   Any User logged Can Create Review on any product
  //  @Route  POST /api/v1/review
  //  @access Private [User]
  @Post()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(@Body() createReviewDto: CreateReviewDto, @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException('You are not allowed to create review');
    }
    const user_id = req.user._id;
    return this.reviewService.create(createReviewDto, user_id);
  }

  //  @docs   Any User Can Get All Reviews On Product
  //  @Route  GET /api/v1/review/:productId
  //  @access Public
  @Get(':id')
  findAll(@Param('id') product_id: string) {
    return this.reviewService.findAll(product_id);
  }

  //  @docs   User logged Can Only update Their Review
  //  @Route  PATCH /api/v1/reviews/:reviewId
  //  @access Private [User]
  @Patch(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.reviewService.update(id, updateReviewDto, user_id);
  }

  //  @docs   User logged Can Only delete Their Review
  //  @Route  DELETE /api/v1/review:reviewId
  //  @access Private [User]
  @Delete(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string , @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.reviewService.remove(id, user_id);
  }
}
@Controller('dashboard/reviews')
export class ReviewDashboardController {
  constructor(private readonly reviewService: ReviewService) {}

  //  @docs   Any User Can Get All Reviews On User
  //  @Route  GET /api/v1/review:userId
  //  @access Private [Admin]
  @Get(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') user_id: string) {
    return this.reviewService.findOne(user_id);
  }
}
