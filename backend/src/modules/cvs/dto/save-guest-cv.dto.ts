import {
  IsString,
  Length,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SectionType } from '../../sections/entities/section-type.enum';

export class SaveGuestSectionItemDto {
  @ApiProperty({
    example: 'PERSONAL_INFO',
    enum: SectionType,
  })
  @IsEnum(SectionType)
  type!: SectionType;

  @ApiProperty({
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  orderIndex!: number;

  @ApiProperty({
    example: { fullName: 'John Doe', headline: 'Software Engineer' },
  })
  @IsObject()
  content!: Record<string, any>;
}

export class SaveGuestCvDto {
  @ApiProperty({
    example: 'My CV from sessionStorage',
    minLength: 1,
    maxLength: 150,
    required: false,
  })
  @IsString()
  @Length(1, 150)
  @IsOptional()
  title?: string;

  @ApiProperty({
    type: [SaveGuestSectionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveGuestSectionItemDto)
  sections!: SaveGuestSectionItemDto[];
}
