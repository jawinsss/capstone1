import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if passwords match
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { username: registerDto.username }
        ]
      }
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
        role: 'USER',
      },
    });

    // Generate JWT token
    const payload = { username: user.username, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Create audit log for user registration
    try {
      await this.auditService.createAuditLog({
        userId: user.id,
        action: 'CREATE',
        resource: 'USER',
        resourceId: user.id,
        details: {
          registrationMethod: 'email',
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        ipAddress: null, // Will be set by controller if available
        userAgent: null, // Will be set by controller if available
      });
    } catch (error) {
      console.error('Failed to create audit log for registration:', error);
    }

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: loginDto.username },
          { email: loginDto.username }
        ],
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if trying to login as admin
    if (loginDto.isAdmin && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { username: user.username, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Create audit log for user login
    try {
      await this.auditService.createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
        details: {
          loginMethod: 'email',
          username: user.username,
          email: user.email,
          role: user.role,
          isAdmin: loginDto.isAdmin || false
        },
        ipAddress: null, // Will be set by controller if available
        userAgent: null, // Will be set by controller if available
      });
    } catch (error) {
      console.error('Failed to create audit log for login:', error);
    }

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Create audit log for user logout
    try {
      await this.auditService.createAuditLog({
        userId: userId,
        action: 'LOGOUT',
        resource: 'USER',
        resourceId: userId,
        details: {
          logoutTime: new Date().toISOString(),
          reason: 'User initiated logout'
        },
        ipAddress: null, // Will be set by controller if available
        userAgent: null, // Will be set by controller if available
      });
    } catch (error) {
      console.error('Failed to create audit log for logout:', error);
    }

    return { message: 'Logout successful' };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
