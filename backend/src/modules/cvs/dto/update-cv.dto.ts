import { IsString, Length, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCvDto {
  @ApiProperty({
    example: 'My Updated CV Title',
    minLength: 1,
    maxLength: 150,
  })
  @IsString()
  @Length(1, 150)
  @IsNotEmpty()
  title!: string;
}
