import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUser: any) {
    // Only admins can create users
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create users');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username }
        ]
      }
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        gender: createUserDto.gender,
        role: createUserDto.role || 'USER',
        isActive: true,
      },
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
        createdAt: true,
      },
    });

    return {
      success: true,
      data: user,
      message: 'User created successfully'
    };
  }

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
    const user = await this.findOne(id);

    // Only admins can delete users
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete users');
    }

    // Prevent admin from deleting themselves
    if (currentUser.id === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Use transaction to ensure all related data is deleted
    return this.prisma.$transaction(async (tx) => {
      // Delete all related data first
      await tx.review.deleteMany({ where: { userId: id } });
      await tx.ticket.deleteMany({ where: { userId: id } });
      
      // Delete orders and related data
      const orders = await tx.order.findMany({ where: { userId: id } });
      for (const order of orders) {
        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
        await tx.payment.deleteMany({ where: { orderId: order.id } });
        await tx.returnRequest.deleteMany({ where: { orderId: order.id } });
      }
      await tx.order.deleteMany({ where: { userId: id } });

      // Finally delete the user
      return tx.user.delete({ where: { id } });
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

  async activate(id: string, currentUser: any) {
    // Check if user exists
    await this.findOne(id);

    // Only admins can activate users
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can activate users');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
