import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

export enum MaterialType {
    WATER_PIPE = 'water_pipe',
    ELECTRICAL = 'electrical',
    STEEL = 'steel',
    GENERAL = 'general',
}

export class MaterialCalculatorRequestDto {
    @ApiProperty({
        example: 'Tôi cần ống nước cho nhà 2 tầng, đường ống chính dài 25m',
        description: 'Người mô tả nhu cầu bằng ngôn ngữ tự nhiên',
    })
    @IsString()
    @IsNotEmpty()
    question: string;

    @ApiProperty({
        example: 25,
        description: 'Độ dài ước tính (m) hoặc con số liên quan tới bài toán',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    length?: number;

    @ApiProperty({
        example: { powerHP: 2 },
        description: 'Thông số kỹ thuật bổ sung (HP, công suất KW, lưu lượng, áp lực...)',
        required: false,
    })
    @IsOptional()
    additionalInfo?: any;

    @ApiProperty({
        example: MaterialType.GENERAL,
        description: 'Tùy chọn: loại vật tư (nếu đã xác định)',
        required: false,
    })
    @IsOptional()
    @IsEnum(MaterialType)
    type?: MaterialType;
}

