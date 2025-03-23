import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Roles } from 'src/user/decorator/roles.decorator';
import { AuthGuard } from 'src/user/guard/Auth.guard';
import { CreateSuppliersDto } from './dto/create-supplier.dto';
import { UpdateSuppliersDto } from './dto/update-supplier.dto';


@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(@Body() createSupplierDto: CreateSuppliersDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSuppliersDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
