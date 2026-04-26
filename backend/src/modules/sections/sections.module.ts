import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvSectionEntity } from './entities/cv-section.entity';
import { SectionsService } from './services/sections.service';
import { SectionsController } from './controllers/sections.controller';
import { CvsModule } from '../cvs/cvs.module';

@Module({
  imports: [TypeOrmModule.forFeature([CvSectionEntity]), CvsModule],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}
