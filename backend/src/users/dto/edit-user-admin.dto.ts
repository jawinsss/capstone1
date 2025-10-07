import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class EditUserAdminDto {
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

  @ApiProperty({ description: 'User gender', required: false })
  @IsOptional()
  @IsIn(['Nam', 'Nữ', 'Khác'])
  gender?: 'Nam' | 'Nữ' | 'Khác';

  @ApiProperty({ description: 'User role', required: false })
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: 'USER' | 'ADMIN';

  @ApiProperty({ description: 'Avatar image URL', required: false })
  @IsOptional()
  @IsString()
  avt_img?: string;

  @ApiProperty({ description: 'User active status', required: false })
  @IsOptional()
  isActive?: boolean;
}
