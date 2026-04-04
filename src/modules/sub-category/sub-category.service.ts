import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubCategory } from 'src/schema/sub-category.schema';
import { CreateSubCategoryDto } from './sub-category.dto';
import { Category } from 'src/schema/category.schema';

@Injectable()
export class SubCategoryService {
    constructor(
        @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
        @InjectModel(SubCategory.name) private readonly subCategoryModel: Model<SubCategory>){}
    
    async getSubcategoriesById(categoryId: string)
    {
        const category = await this.categoryModel.findById(categoryId);
        return await this.subCategoryModel.find({category: category?._id})
    }

    async create(createSubcategoryDto: CreateSubCategoryDto): Promise<SubCategory> {
        // Find the category by categoryId
        const category = await this.categoryModel.findById(createSubcategoryDto.categoryId);
        if (!category) {
          throw new Error('Category not found');
        }
    
        // Create the subcategory and associate it with the found category
        const subcategory = new this.subCategoryModel({
          category: category._id, // Reference the found category
          name: createSubcategoryDto.name,
          description: createSubcategoryDto.description,
        });
    
        return await subcategory.save(); // Save the new subcategory
      }

    async update(id, updateSubcategoryDto)
    {
        return this.subCategoryModel.findByIdAndUpdate(id, updateSubcategoryDto)
    }
    
    async delete(id: string)
    {
        return await this.subCategoryModel.findByIdAndDelete(id)
    }
    async getOne(id: string)
    {
      return await this.subCategoryModel.findById(id)
    }

    async countSubcategories()
    {
        return this.subCategoryModel.countDocuments()
    }
}

