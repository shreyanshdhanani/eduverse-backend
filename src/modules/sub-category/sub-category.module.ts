import { Module } from '@nestjs/common';
import { SubCategoryController } from './sub-category.controller';
import { SubCategoryService } from './sub-category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategory, SubCategorySchema } from 'src/schema/sub-category.schema';
import { Category, CategorySchema } from 'src/schema/category.schema';

@Module({
  imports:[MongooseModule.forFeature([{name: SubCategory.name, schema: SubCategorySchema},
    {name: Category.name, schema: CategorySchema}
  ])],
  controllers: [SubCategoryController],
  providers: [SubCategoryService],
  exports:[SubCategoryService]
})
export class SubCategoryModule {}
