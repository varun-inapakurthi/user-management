import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsString()
  surname: string;
  @IsNotEmpty()
  @IsString()
  username: string;
  birthdate: Date;
}
