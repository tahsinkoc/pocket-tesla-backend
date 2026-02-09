import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please type valid email.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be 6 chars at least' })
  @MaxLength(64, { message: 'Password must be less than 64 char' })
  password: string;
}
