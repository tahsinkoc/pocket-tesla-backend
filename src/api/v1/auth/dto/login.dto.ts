import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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
  @IsString()
  @MinLength(6, { message: 'Password must be 6 chars at least' })
  @MaxLength(64, { message: 'Password must be less than 64 char' })
  password: string;
}
