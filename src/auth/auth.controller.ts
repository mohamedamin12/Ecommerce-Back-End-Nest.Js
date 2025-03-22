import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() email: ResetPasswordDto) {
    return this.authService.forgotPassword(email);
  }

  @Post('verify-code')
  verifyCode(
    @Body()
    verifyCode: {
      email: string;
      code: string;
    },
  ) {
    return this.authService.verifyCode(verifyCode);
  }

  @Patch('reset-password')
  resetPassword(@Body() changePasswordData: SignInDto,) {
    return this.authService.resetPassword(changePasswordData);
  }


}
