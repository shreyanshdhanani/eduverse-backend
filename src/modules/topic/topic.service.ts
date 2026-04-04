import { Injectable } from '@nestjs/common';
import { CreateTopicDto, UpdateTopicDto } from './topic.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Topic } from 'src/schema/topic.schema';
import { Model } from 'mongoose';
import { SubCategory } from 'src/schema/sub-category.schema';

@Injectable()
export class TopicService {
    constructor(
        @InjectModel(SubCategory.name) private readonly subcategoryModel: Model<SubCategory>,
        @InjectModel(Topic.name) private readonly topicModel: Model<Topic>){}


    async getTopicsById(id)
    {
        return this.topicModel.findById(id)
    }
    async getAllTopic()
        {
            return this.topicModel.find()
        }
    async getSubcategoriesById(id)
    {
        return this.subcategoryModel.findById(id)
    }

    async getTopicsBySubcategoryId(id)
    {
        const subcategory = await this.subcategoryModel.findById(id);
        return await this.topicModel.find({subCategory: subcategory?._id})
    }
    async create(createTopicDto: CreateTopicDto)
    {

         const subcategory = await this.subcategoryModel.findById(createTopicDto.subCategory);
         if (!subcategory) {
           throw new Error('subCategory not found');
         }

         const topic = new this.topicModel({
           subCategory: subcategory._id,
           name: createTopicDto.name,
           description: createTopicDto.description,
         });
     
         return await topic.save();
    }

    async update(id, updateTopicDto: UpdateTopicDto)
    {
        return this.topicModel.findByIdAndUpdate(id, updateTopicDto)   
    }

    async delete(id)
    {
        return await this.topicModel.findByIdAndDelete(id)
    }
    
    
    async getOne(id)
    {
        return await this.topicModel.findById(id)
    }

    async countTopics()
    {
        return this.topicModel.countDocuments()
    }
}
