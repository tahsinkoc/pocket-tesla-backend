import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
    
    @IsEmail({}, { message: 'Please type valid email.' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be 6 chars at least' })
    @MaxLength(64, { message: 'Password must be less than 64 char' })
    password: string;

    @IsNotEmpty({ message: 'Phone number is required' })
    @IsPhoneNumber("TR", { message: 'Please type valid phone number' })
    phone: string;

    @IsNotEmpty({ message: 'Fullname is required' })
    fullname: string;
    
}