import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) { }
  async create(createUserDto: CreateUserDto) {
    const userExists = await this.userModel.findOne(
      { email: createUserDto.email }
    );
    if (userExists) {
      throw new BadRequestException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = {
      hashedPassword,
      role: createUserDto.role ?? 'user',
      active: true,
    };
    const newUser = await this.userModel.create({ ...createUserDto, ...user });
    return {
      message: 'User created successfully',
      data: newUser,
    };

  }

  async findAll(query) {
    const {
      _limit = 1000_000_000,
      skip = 0,
      sort = 'asc',
      name,
      email,
      role,
    } = query;

    if (Number.isNaN(Number(+_limit))) {
      throw new BadRequestException(
        "The 'limit' query parameter should be a number"
      );
    }

    if (Number.isNaN(Number(+skip))) {
      throw new BadRequestException(
        "The 'skip' query parameter should be a number"
      );
    }

    if (!['asc', 'desc'].includes(sort)) {
      throw new BadRequestException(
        "The 'sort' query parameter should be 'asc' or 'desc'"
      );
    }

    // or=> whare by all keyword, RegExp=> whare by any keyword
    const users = await this.userModel
      .find()
      .skip(skip)
      .limit(_limit)
      .where('name', new RegExp(name, 'i'))
      .where('email', new RegExp(email, 'i'))
      .where('role', new RegExp(role, 'i'))
      .sort({ name: sort })
      .select('-password -__v')
      .exec();
    return {
      message: 'Users fetched successfully',
      data: users,
      count: users.length,
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      data: user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userExist = await this.userModel
    .findById(id)
    .select('-password -__v');
    if (!userExist) {
      throw new NotFoundException('User not found')
    }
    let user = {
      ...updateUserDto,
    };
    if (updateUserDto.password) {
      const password = await bcrypt.hash(updateUserDto.password, 10);
      user = {
        ...user,
        password,
      };
    }
    return {
      message: 'User updated successfully',
      data: await this.userModel.findByIdAndUpdate(id, user, { new: true }),
    }
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndDelete(id);
    return {
      message: 'User deleted successfully',
      data: user,
    };
  }
  
  // ===================== For User =====================
  // User Can Get Data
  async getMe(payload) {
    if (!payload._id) {
      throw new NotFoundException("User not found");
    }

    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return {
      status: 200,
      message: "User fetched successfully",
      data: user,
    };
  }
    // User Can Update Data
    async updateMe(payload , updateUserDto:UpdateUserDto){
      if(payload._id){
        throw new NotFoundException("User not found");
      }
      const user = await this.userModel.findById(payload._id).select('-password -__v');
      if(!user){
        throw new NotFoundException("User not found");
      }
      return {
        message: 'User updated successfully',
        data: await this.userModel
        .findByIdAndUpdate(payload._id, updateUserDto, { new: true })
        .select('-password -__v'),
      }
    }
    // User Can Delete Data
    async deleteMe(payload){
      if(!payload._id){
        throw new NotFoundException("User not found");
      }
      const user = await this.userModel.findById(payload._id).select('-password -__v');
      if(!user){
        throw new NotFoundException("User not found");
      }
      await this.userModel.findByIdAndDelete(payload._id);
      return {
        message: 'User deleted successfully',
        data: user,
      } 
    }
}
