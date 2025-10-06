import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        avt_img: true,
        gender: true,
        role: true,
        isActive: true,
        province: true,
        provinceName: true,
        district: true,
        ward: true,
        wardName: true,
        street: true,
        fullAddress: true,
        createdAt: true,
      },
    });
    
    return {
      success: true,
      data: users
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        avt_img: true,
        gender: true,
        role: true,
        isActive: true,
        province: true,
        provinceName: true,
        district: true,
        ward: true,
        wardName: true,
        street: true,
        fullAddress: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    // Check if user exists
    const existingUser = await this.findOne(id);

    // Only allow users to update their own profile, or admins to update any profile
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        avt_img: true,
        gender: true,
        role: true,
        isActive: true,
        province: true,
        provinceName: true,
        district: true,
        ward: true,
        wardName: true,
        street: true,
        fullAddress: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, currentUser: any) {
    // Check if user exists
    await this.findOne(id);

    // Only admins can delete users
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete users');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async deactivate(id: string, currentUser: any) {
    // Check if user exists
    await this.findOne(id);

    // Only admins can deactivate users
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
