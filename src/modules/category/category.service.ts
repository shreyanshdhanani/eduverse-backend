import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from 'src/schema/category.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class CategoryService {
    constructor(@InjectModel(Category.name) private categoryModel: Model<Category>){}
    
    async getAll()
    {
        return this.categoryModel.find()
    }

    async getOne(id)
    {
        return this.categoryModel.findById(id)
    }

    async create(createCategoryDto: CreateCategoryDto)
    {
        return this.categoryModel.create(createCategoryDto)
    }

    async delete(id: string)
    {
        console.log('id', id)
        return this.categoryModel.findByIdAndDelete(id)
    }

    async update(id, updateCategoryDto)
    {
        return this.categoryModel.findByIdAndUpdate(id, updateCategoryDto)
    }

    async countCategories()
    {
        return this.categoryModel.countDocuments()
    }
}
