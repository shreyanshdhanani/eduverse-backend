import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  planName: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  maxStudents: number;

  @IsNumber()
  @Min(1)
  maxCoursesPerStudent: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSubscriptionPlanDto {
  @IsString()
  @IsOptional()
  planName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxStudents?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxCoursesPerStudent?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignPlanDto {
  @IsString()
  @IsNotEmpty()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsNumber()
  @Min(1)
  durationDays: number; // e.g. 365 for 1 year
}
