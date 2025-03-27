import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, UseFilters } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from './guard/Auth.guard';
import { Roles } from './decorator/roles.decorator';
import { I18n, I18nContext, I18nValidationExceptionFilter } from 'nestjs-i18n';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  @UseFilters(new I18nValidationExceptionFilter())
  create(@Body() createUserDto: CreateUserDto ,  @I18n() i18n: I18nContext) {
    return this.userService.create(createUserDto , i18n);
  }

  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAll(@Query() query , @I18n() i18n: I18nContext) {
    return this.userService.findAll(query , i18n);
  }

  @Get(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string , @I18n() i18n: I18nContext) {
    return this.userService.findOne(id , i18n);
  }

  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto ,  @I18n() i18n: I18nContext) {
    return this.userService.update(id, updateUserDto , i18n);
  }

  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string , @I18n() i18n: I18nContext) {
    return this.userService.remove(id , i18n);
  }
}

@Controller('userMe')
export class UserMeController {
  constructor(private readonly userService: UserService) {}
  @Get()
  @Roles(['user', 'admin'])
  @UseGuards(AuthGuard)
  getMe(@Req() req , @I18n() i18n : I18nContext) {
    return this.userService.getMe(req.user , i18n);
  }

  @Patch()
  @Roles(['user', 'admin']) 
  @UseGuards(AuthGuard)
  updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto , @I18n() i18n: I18nContext,) {
    return this.userService.updateMe(req.user, updateUserDto , i18n);
  }

  @Delete()
  @Roles(['user', 'admin'])
  @UseGuards(AuthGuard)
  deleteMe(@Req() req , @I18n() i18n: I18nContext) {
    return this.userService.deleteMe(req.user , i18n);
  }
}
