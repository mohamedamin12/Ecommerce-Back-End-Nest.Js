import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { I18nContext } from 'nestjs-i18n';


@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) { }
  async create(createUserDto: CreateUserDto, i18n: I18nContext) {
    const userExists = await this.userModel.findOne(
      { email: createUserDto.email }
    );
    if (userExists) {
      throw new BadRequestException(
        await i18n.t('service.ALREADY_EXIST', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      ); // User already exists
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = {
      hashedPassword,
      role: createUserDto.role ?? 'user',
      active: true,
    };
    const newUser = await this.userModel.create({ ...createUserDto, ...user });
    return {
      message: await i18n.t('service.CREATED_SUCCESS', {
        args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
      }),
      data: newUser,
    };

  }

  async findAll(query, i18n: I18nContext) {
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
        await i18n.t('service.INVALID', { args: { invalid_name: 'limit' } }),
      );
    }

    if (Number.isNaN(Number(+skip))) {
      throw new BadRequestException(
        await i18n.t('service.INVALID', { args: { invalid_name: 'skip' } }),
      );
    }

    if (!['asc', 'desc'].includes(sort)) {
      throw new BadRequestException(
        await i18n.t('service.INVALID', { args: { invalid_name: 'sort' } }),
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
      message: await i18n.t('service.FOUND_SUCCESS', {
        args: { found_name: i18n.lang === 'en' ? 'Users' : 'المستخدمين' },
      }),
      data: users,
      count: users.length,
    };
  }

  async findOne(id: string, i18n: I18nContext) {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }
    return {
      data: user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto, i18n: I18nContext,) {
    const userExist = await this.userModel
      .findById(id)
      .select('-password -__v');
    if (!userExist) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      )
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
      message: await i18n.t('service.UPDATED_SUCCESS', {
        args: { updated_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
      }),
      data: await this.userModel.findByIdAndUpdate(id, user, { new: true }),
    }
  }

  async remove(id: string, i18n: I18nContext,) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }
    await this.userModel.findByIdAndDelete(id);
    return {
      message: await i18n.t('service.DELETED_SUCCESS', {
        args: { deleted_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
      }),
      data: user,
    };
  }

  // ===================== For User =====================
  // User Can Get Data
  async getMe(payload, i18n: I18nContext) {
    if (!payload._id) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }

    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }
    return {
      status: 200,
      message: await i18n.t('service.FOUND_SUCCESS', {
        args: { found_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
      }),
      data: user,
    };
  }
  // User Can Update Data
  async updateMe(payload, updateUserDto: UpdateUserDto, i18n: I18nContext) {
    if (payload._id) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }
    const user = await this.userModel.findById(payload._id).select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }
    return {
      message: await i18n.t('service.UPDATED_SUCCESS', {
        args: { updated_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
      }),
      data: await this.userModel
        .findByIdAndUpdate(payload._id, updateUserDto, { new: true })
        .select('-password -__v'),
    }
  }
  // User Can Delete Data
  async deleteMe(payload , i18n: I18nContext) : Promise<void> {
    if (!payload._id) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }
    const user = await this.userModel.findById(payload._id).select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { module_name: i18n.lang === 'en' ? 'User' : 'المستخدم' },
        })
      );
    }
    await this.userModel.findByIdAndDelete(payload._id);
  }
}
