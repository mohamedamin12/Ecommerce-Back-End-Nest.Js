import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { AuthGuard } from 'src/user/guard/Auth.guard';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

   //  @docs  Can Admin Create Or Update Tax
  //  @Route  POST /api/v1/tex
  //  @access Private [admin]
  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(@Body() createTexDto: CreateTaxDto) {
    return this.taxService.createOrUpdate(createTexDto);
  }

  //  @docs  Can Admin Get Tax
  //  @Route  GET /api/v1/tex
  //  @access Private [admin]
  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  find() {
    return this.taxService.find();
  }

  //  @docs  Can Admin ReSet Tes
  //  @Route  DELETE /api/v1/tex
  //  @access Private [admin]
  @Patch()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  reSet() {
    return this.taxService.reSet();
  }
}
