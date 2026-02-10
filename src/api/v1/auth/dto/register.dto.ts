import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please type valid email.' })
  email: string;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'password123',
    minLength: 6,
    maxLength: 64,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be 6 chars at least' })
  @MaxLength(64, { message: 'Password must be less than 64 char' })
  password: string;

  @ApiProperty({
    description: 'Phone number with country code',
    example: '+905551234567',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber('TR', { message: 'Please type valid phone number' })
  phone: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty({ message: 'Fullname is required' })
  fullname: string;
}