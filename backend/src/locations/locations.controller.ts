import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách tỉnh/thành phố với tìm kiếm và phân trang' })
  @ApiResponse({ status: 200, description: 'Danh sách tỉnh/thành phố' })
  getProvinces(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.locationsService.getProvinces(search, page, limit);
  }

  @Get('wards/:provinceId')
  @ApiOperation({ summary: 'Lấy danh sách phường/xã theo tỉnh/thành phố với tìm kiếm và phân trang' })
  @ApiResponse({ status: 200, description: 'Danh sách phường/xã' })
  getWards(
    @Param('provinceId') provinceId: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.locationsService.getWards(provinceId, search, page, limit);
  }
}
