import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CreateSubCategoryDto, UpdateSubcategoryDto } from './sub-category.dto';
import { SubCategoryService } from './sub-category.service';

@Controller('sub-category')
export class SubCategoryController {
    constructor(private readonly subCategoryService: SubCategoryService){}

    @Get('/category/:id')
    async getSubcategoriesById(@Param('id') categoryId: string)
    {
        return this.subCategoryService.getSubcategoriesById(categoryId)
    }

    @Post()
    async createSubcategory(@Body() createSubcategoryDto: CreateSubCategoryDto )
    {
        return this.subCategoryService.create(createSubcategoryDto)
    }

    @Delete(':id')
    async delete(@Param('id') id: string)
    {
        return this.subCategoryService.delete(id)
    }


    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateCategoryDto:UpdateSubcategoryDto)
    {
        return this.subCategoryService.update(id, updateCategoryDto)
    }
}
