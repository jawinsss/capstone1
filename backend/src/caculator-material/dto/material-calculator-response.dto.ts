import { ApiProperty } from '@nestjs/swagger';

export class MaterialSuggestionDto {
    @ApiProperty({ example: 'Ống PPR PN20 D25' })
    name: string;

    @ApiProperty({ example: 'ppr' })
    category: string;

    @ApiProperty({
        example: {
            diameter: '25mm',
            pressure: 'PN20',
            thickness: '2.8mm',
        },
    })
    specs: Record<string, any>;

    @ApiProperty({ example: 12 })
    estimatedQuantity: number;

    @ApiProperty({
        example: 'chiều dài 25m cho nhà 2 tầng, tính toán hệ số tổn thất.',
    })
    reasoning: string;
}

export class MaterialCalculatorResponseDto {
    @ApiProperty({
        example: 'Đối với nhà 2 tầng bạn nên dùng ống PPR PN20 để chịu áp tốt.',
    })
    aiExplanation: string;

    @ApiProperty({
        type: [MaterialSuggestionDto],
        description: 'Danh sách sản phẩm AI đề xuất',
    })
    suggestions: MaterialSuggestionDto[];

    @ApiProperty({
        example: [
            'PN20 phù hợp do áp nước tầng 2.',
            'Đường kính 25mm đảm bảo lưu lượng ổn định.',
        ],
    })
    notes: string[];
}