import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Username for login' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'User gender', required: false })
  @IsOptional()
  @IsIn(['Nam', 'Nữ', 'Khác'])
  gender?: 'Nam' | 'Nữ' | 'Khác';

  @ApiProperty({ description: 'User role', required: false, default: 'USER' })
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

  @ApiProperty({ description: 'Avatar image URL', required: false })
  @IsOptional()
  @IsString()
  avt_img?: string;
}
