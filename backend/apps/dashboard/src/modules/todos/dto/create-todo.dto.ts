import { Trim } from '@app/shared';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTodoDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
