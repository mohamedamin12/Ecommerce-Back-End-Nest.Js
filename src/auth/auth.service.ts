import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcryptjs';
import { SignInDto } from './dto/sign-in.dto';



@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    // private readonly mailService: MailerService,
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
}
