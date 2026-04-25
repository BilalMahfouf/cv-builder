import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSectionDto {
  @ApiProperty({
    example: { fullName: 'Jane Doe', headline: 'Senior Engineer' },
  })
  @IsObject()
  @IsNotEmpty()
  content!: Record<string, any>;
}
