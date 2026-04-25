import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvEntity } from './entities/cv.entity';
import { CvSectionEntity } from '../sections/entities/cv-section.entity';
import { CvsService } from './services/cvs.service';
import { CvsController } from './controllers/cvs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CvEntity, CvSectionEntity])],
  controllers: [CvsController],
  providers: [CvsService],
  exports: [CvsService],
})
export class CvsModule {}
