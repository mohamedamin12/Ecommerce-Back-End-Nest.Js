import { IsBoolean, IsDate, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  shippingAddress: string;
}

export class AcceptOrderCashDto {
  @IsOptional()
  @IsBoolean()
  isPaid: boolean;
  @IsOptional()
  @IsDate()
  paidAt: Date;
  @IsOptional()
  @IsBoolean()
  isDelivered: boolean;
  @IsOptional()
  @IsDate()
  deliveredAt: Date;
}