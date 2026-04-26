import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum MoveDirection {
  UP = 'up',
  DOWN = 'down',
}

export class MoveSectionDto {
  @ApiProperty({
    example: 'up',
    enum: MoveDirection,
  })
  @IsEnum(MoveDirection)
  direction!: 'up' | 'down';
}
