import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @MinLength(10, { message: 'Nội dung phải có ít nhất 10 ký tự' })
  message: string;
}
