// src/university/dto/university-registration.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsUrl, Length } from 'class-validator';

export class UniversityRegistrationDto {
  @IsNotEmpty()
  @Length(3, 100)
  universityName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Length(6, 20)
  @IsOptional()
  password: string;

  @IsNotEmpty()
  @Length(10, 200)
  address: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  contactNumber: string;

  @IsUrl()
  @IsOptional()
  website: string;

  @IsOptional()
  logo: string;
}
