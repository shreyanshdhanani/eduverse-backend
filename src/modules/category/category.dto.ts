import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto{
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description: string;
}

export class UpdateCategoryDto{
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    @IsOptional()
    description: string;
}

