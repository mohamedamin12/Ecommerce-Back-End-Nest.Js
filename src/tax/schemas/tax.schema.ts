import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type texDocument = HydratedDocument<Tax>;

@Schema({ timestamps: true })
export class Tax {
  @Prop({
    type: Number,
    default: 0,
  })
  taxPrice: number;
  @Prop({
    type: Number,
    default: 0,
  })
  shippingPrice: number;
}

export const taxSchema = SchemaFactory.createForClass(Tax);