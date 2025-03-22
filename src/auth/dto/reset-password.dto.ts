import { IsEmail, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  // Email
  @IsString({ message: 'Email must be a string' })
  @MinLength(0, { message: 'This Email Must be Required' })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;
}