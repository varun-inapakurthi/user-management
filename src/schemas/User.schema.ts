import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop()
  surname: string;

  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ required: true })
  birthdate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
