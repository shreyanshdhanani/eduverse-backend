import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateCourseProviderDto{
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsNumber()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    address: string;
}

export class CreateBasicInformationDto{
    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    description: string

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsNotEmpty()
    subcategory: string;

    @IsString()
    @IsNotEmpty()
    topic: string;

    @IsString()
    @IsNotEmpty()
    courseLevel: string;

    @IsString()
    @IsNotEmpty()
    language: string;

    @IsString()
    @IsNotEmpty()
    courseDuration: string;

    @IsString()
    @IsNotEmpty()
    thumbnailImage: string;

    @IsString()
    @IsNotEmpty()
    previewVideo: string; 

    @IsString()
    @IsNotEmpty()
    CourseProvider: string;
   
}