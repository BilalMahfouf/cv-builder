import { IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCvDto {
  @ApiProperty({
    example: 'My Professional CV',
    minLength: 1,
    maxLength: 150,
    required: false,
  })
  @IsString()
  @Length(1, 150)
  @IsOptional()
  title?: string;
}
