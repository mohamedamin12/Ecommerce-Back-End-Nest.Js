import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcryptjs';
import { SignInDto } from './dto/sign-in.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';




@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
  ) { }

  async signUp(signUp: SignUpDto) {
    const user = await this.userModel.findOne({ email: signUp.email });
    if (user) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(signUp.password, 10);
    const userCreated = {
      password: hashedPassword,
      role: 'user',
      active: true,
    };
    const newUser = await this.userModel.create({
      ...signUp,
      ...userCreated,
    });

    const payload = {
      _id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });

    return {
      message: 'User registered successfully',
      data: newUser,
      access_token: token,
    };
  }

  async signIn(signIn: SignInDto) {
    const user = await this.userModel.findOne({ email: signIn.email });
    if (!user) throw new BadRequestException('invalid email or password');

    const isPasswordMatch = await bcrypt.compare(signIn.password, user.password);
    if (!isPasswordMatch) throw new BadRequestException('invalid email or password');

    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });

    return {
      message: 'User signed in successfully',
      data: user,
      access_token: token,
    };
  }

  async forgotPassword({ email }: ResetPasswordDto) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User Not Found');

    // create code 6 digit
    const code = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
    // insert code in db=> verificationCode
    await this.userModel.findOneAndUpdate(
      { email },
      { verificationCode: code },
    );

    const htmlMessage = `
    <div>
      <h1>Forgot your password? If you didn't forget your password, please ignore this email!</h1>
      <p>Use the following code to verify your account: <h3 style="color: red; font-weight: bold; text-align: center">${code}</h3></p>
      <h6 style="font-weight: bold">Ecommrce-Nest.JS</h6>
    </div>
    `;
    await this.mailService.sendMail({
      from: `Ecommrce-Nest.JS <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Ecommrce-Nest.JS - Reset Password`,
      html: htmlMessage,
    });

    return {
      message: `Code sent successfully on your email (${email})`,
    };

  }

  async verifyCode({ email, code }: { email: string; code: string }) {
    const user = await this.userModel
      .findOne({ email })
      .select('verificationCode');

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (user.verificationCode !== code) {
      throw new UnauthorizedException('Invalid code');
    }

    await this.userModel.findOneAndUpdate(
      { email },
      { verificationCode: null },
    );

    return {
      status: 200,
      message: 'Code verified successfully, go to change your password',
    };
  }

  async resetPassword(changePasswordData: SignInDto) {
    const user = await this.userModel.findOne({
      email: changePasswordData.email,
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    const password = await bcrypt.hash(
      changePasswordData.password, 10
    );
    await this.userModel.findOneAndUpdate(
      { email: changePasswordData.email },
      { password },
    );
    return {
      status: 200,
      message: 'Password changed successfully, go to login',
    };
  }
}
