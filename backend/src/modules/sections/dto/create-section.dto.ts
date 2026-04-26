import { IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SectionType } from '../entities/section-type.enum';

export class CreateSectionDto {
  @ApiProperty({
    example: 'PERSONAL_INFO',
    enum: SectionType,
  })
  @IsEnum(SectionType)
  type!: SectionType;

  @ApiProperty({
    example: { fullName: 'John Doe', headline: 'Software Engineer' },
  })
  @IsObject()
  content!: Record<string, any>;
}
