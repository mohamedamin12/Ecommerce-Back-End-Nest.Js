import { Module } from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { SubCategoryController } from './sub-category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategory, subCategorySchema } from './schemas/sub-category.schema';
import { Category, categorySchema } from 'src/category/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubCategory.name, schema: subCategorySchema },
      { name: Category.name, schema: categorySchema },
    ]),
  ],
  controllers: [SubCategoryController],
  providers: [SubCategoryService],
})
export class SubCategoryModule {}
