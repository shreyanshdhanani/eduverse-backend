import { IsNotEmpty, IsOptional, IsString, IsMongoId } from "class-validator";

export class CreateSubCategoryDto {
  
  @IsNotEmpty()
  @IsMongoId() 
  categoryId: string; 

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

}


export class UpdateSubcategoryDto{
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @IsOptional()
  description: string;
}
