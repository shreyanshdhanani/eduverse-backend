import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTopicDto{
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsMongoId()
    subCategory: string;
}

export class UpdateTopicDto{
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsMongoId()
    subCategory: string;
}