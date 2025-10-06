import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo người dùng mới (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo người dùng thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Người dùng đã tồn tại' })
  create(@Body() createUserDto: CreateUserDto, @Req() req) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng (Admin only)' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin profile của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin profile' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật profile của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  updateProfile(@Body() updateUserDto: UpdateUserDto, @Req() req) {
    return this.usersService.update(req.user.id, updateUserDto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng theo ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa người dùng theo ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vô hiệu hóa người dùng theo ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vô hiệu hóa thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  deactivate(@Param('id') id: string, @Req() req) {
    return this.usersService.deactivate(id, req.user);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kích hoạt người dùng theo ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Kích hoạt thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  activate(@Param('id') id: string, @Req() req) {
    return this.usersService.activate(id, req.user);
  }
}
