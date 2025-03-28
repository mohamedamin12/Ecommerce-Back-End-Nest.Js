import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcrypt from 'bcryptjs';
import { User } from 'src/user/schemas/user.schema';
const saltOrRounds = 10;

type UserData = {
  userId: string;
  email: string;
  name: string;
  photo: string;
};

function generateRandomPassword() {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]\:;?><,./-=';
  let password = '';
  const passwordLength = Math.floor(Math.random() * (20 - 4 + 1)) + 4;

  for (let i = 0; i < passwordLength; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
}

@Injectable()
export class OAuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}
  async validateUser(userData: UserData): Promise<any> {
    // business logic
    const user = await this.userModel.findOne({ email: userData.email });
    //sign-up=> if not, create a new user (create new token) (create new password)
    if (!user) {
      const password = await bcrypt.hash(
        generateRandomPassword(),
        saltOrRounds,
      );
      const newUser = await this.userModel.create({
        email: userData.email,
        name: userData.name,
        avatar: userData.photo,
        password,
        role: 'user',
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
        message: 'User created successfully',
        data: newUser,
        access_token: token,
      };
    }

    //sign-in=> check if user exists in the db (create new token)
    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });

    return {
      message: 'User logged in successfully',
      data: user,
      access_token: token,
    };
  }
}

