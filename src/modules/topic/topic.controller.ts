import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CreateTopicDto, UpdateTopicDto } from './topic.dto';
import { TopicService } from './topic.service';
import { UpdateCategoryDto } from '../category/category.dto';

@Controller('topic')
export class TopicController {
    constructor(private readonly topicService: TopicService){}

    @Get('get-one/:id')
    async getTopicById(@Param('id') id: string)
    {
        return this.topicService.getTopicsById(id)
    }

    @Get('/sub-category/:id')
    async getSubcategory(@Param('id') id: string)
    {
        return this.topicService.getSubcategoriesById(id)
    }

    @Get()
    async getAllTopic(){
        return this.topicService.getAllTopic()
    }

    @Get(':id')
    async getAll(@Param('id') id: string)
    {
        return this.topicService.getTopicsBySubcategoryId(id)
    }

    @Post()
    async create(@Body() createTopicDto:CreateTopicDto)
    {
        return this.topicService.create(createTopicDto)
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto)
    {
        return this.topicService.update(id, updateTopicDto)
    }
    @Delete(':id')
    async delete(@Param('id')id: string)
    {
        return this.topicService.delete(id)
    }

}
