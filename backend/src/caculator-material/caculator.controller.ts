import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CalculatorService } from './caculator.service';
import {
  MaterialCalculatorRequestDto,
} from './dto/material-calculator-request.dto';
import {
  MaterialCalculatorResponseDto,
} from './dto/material-calculator-response.dto';
import { MaterialCalcFormDto } from './dto/material-calc-form.dto';

@ApiTags('calculator')
@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post('materials')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'AI hiểu ngôn ngữ tự nhiên và gợi ý vật tư',
    description:
      'Nhập câu mô tả (VD: "Nhà 2 tầng, ống nước chính 25m") → AI phân tích & gợi ý vật tư.',
  })
  @ApiResponse({
    status: 200,
    type: MaterialCalculatorResponseDto,
  })
  async calculateMaterials(
    @Body() payload: MaterialCalculatorRequestDto,
  ): Promise<MaterialCalculatorResponseDto> {
    return this.calculatorService.calculateMaterials(payload);
  }

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hỏi nhanh',
    description: 'AI trả lời câu hỏi ngắn, không cần tính toán chi tiết.',
  })
  @ApiResponse({
    status: 200,
    type: MaterialCalculatorResponseDto,
  })
  async askCalculator(
    @Body() payload: MaterialCalculatorRequestDto,
  ): Promise<MaterialCalculatorResponseDto> {
    return this.calculatorService.calculateMaterials(payload);
  }

  @Post('form-calc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tính toán vật tư dựa trên form lựa chọn',
    description:
      'Người dùng chọn danh mục, loại sản phẩm, nhập thông số và số lượng sản phẩm muốn xem.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm phù hợp + số lượng ước tính.',
  })
  async calculateFromForm(@Body() payload: MaterialCalcFormDto) {
    console.log('[CalculatorController] form-calc payload:', JSON.stringify(payload));
    return this.calculatorService.calculateFromForm(payload);
  }

  @Post('category-specs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy thông tin danh mục + thông số mặc định và mẫu sản phẩm',
    description: 'Trả về thông số gợi ý, phạm vi giá và mẫu sản phẩm trong danh mục',
  })
  @ApiResponse({ status: 200 })
  async getCategorySpecs(@Body() body: { categoryId: string }) {
    return this.calculatorService.getCategorySpecifications(body.categoryId);
  }
}
