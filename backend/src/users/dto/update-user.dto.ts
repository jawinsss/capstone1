import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User full name', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ description: 'User email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'User phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'User role', required: false })
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: 'USER' | 'ADMIN';

  @ApiProperty({ description: 'Province/City', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: 'District', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ description: 'Ward/Commune', required: false })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ description: 'Street address (house number, street name)', required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ description: 'Full address', required: false })
  @IsOptional()
  @IsString()
  fullAddress?: string;

  @ApiProperty({ description: 'Province name (display name)', required: false })
  @IsOptional()
  @IsString()
  provinceName?: string;

  @ApiProperty({ description: 'Ward name (display name)', required: false })
  @IsOptional()
  @IsString()
  wardName?: string;
}
