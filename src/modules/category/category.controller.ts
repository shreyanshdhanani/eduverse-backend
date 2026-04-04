import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';

@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService){}

    @Get()
    async getAll()
    {
        return this.categoryService.getAll()
    }

    @Get(':id')
    async getOne(@Param('id') id: string)
    {
        return this.categoryService.getOne(id)
    }

    @Post()
    async create(@Body() createCategoryDto:CreateCategoryDto)
    {
        return this.categoryService.create(createCategoryDto)
    }

    @Delete(':id')
    async delete(@Param('id') id: string)
    {
        return this.categoryService.delete(id)
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateCategoryDto:UpdateCategoryDto)
    {
        return this.categoryService.update(id, updateCategoryDto)
    }
}
