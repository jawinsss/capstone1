import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocationsService {
  private provincesData: any = null;
  private wardsData: any = null;

  private loadProvincesData() {
    if (!this.provincesData) {
      try {
        const filePath = path.join(process.cwd(), 'province.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        this.provincesData = JSON.parse(fileContent);
      } catch (error) {
        console.error('Error loading provinces data:', error);
        this.provincesData = [];
      }
    }
    return this.provincesData;
  }

  private loadWardsData() {
    if (!this.wardsData) {
      try {
        const filePath = path.join(process.cwd(), 'ward.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        this.wardsData = JSON.parse(fileContent);
      } catch (error) {
        console.error('Error loading wards data:', error);
        this.wardsData = [];
      }
    }
    return this.wardsData;
  }

  getProvinces(search?: string, page: number = 1, limit: number = 5) {
    const provincesData = this.loadProvincesData();
    // Convert object to array
    let provinces = Object.values(provincesData);
    
    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      provinces = provinces.filter((province: any) => 
        province.name.toLowerCase().includes(searchTerm) ||
        province.name_with_type.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply pagination
    const total = provinces.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProvinces = provinces.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedProvinces,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: endIndex < total
      },
      message: 'Danh sách tỉnh/thành phố'
    };
  }

  getWards(provinceId: string, search?: string, page: number = 1, limit: number = 5) {
    const wardsData = this.loadWardsData();
    // Convert object to array and filter by parent_code
    let wards = Object.values(wardsData).filter((ward: any) => ward.parent_code === provinceId);
    
    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      wards = wards.filter((ward: any) => 
        ward.name.toLowerCase().includes(searchTerm) ||
        ward.name_with_type.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply pagination
    const total = wards.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWards = wards.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedWards,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: endIndex < total
      },
      message: `Danh sách phường/xã của tỉnh ${provinceId}`
    };
  }
}
