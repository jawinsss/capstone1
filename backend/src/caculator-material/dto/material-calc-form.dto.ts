import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class MaterialCalcFormDto {
  @ApiPropertyOptional({
    description: 'ID of main category',
    example: 'category-id-here',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ID of subcategory',
    example: 'subcategory-id-here',
  })
  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @ApiPropertyOptional({
    description: 'Product type name',
    example: 'Găng tay bảo hộ',
  })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({
    description: 'Number of products to display (1-20)',
    example: 5,
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @Transform(({ value }) => (value ? Number(value) : 5))
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Dynamic specifications object (key-value pairs)',
    example: { size: 'xl', color: 'vàng', material: 'vải' },
  })
  @IsOptional()
  @IsObject()
  specs?: Record<string, any>;
}
