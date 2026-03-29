import { Trim } from '@app/shared';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTodoDto {
  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
