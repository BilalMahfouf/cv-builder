import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CvSectionEntity } from '../entities/cv-section.entity';
import { CvsService } from '../../cvs/services/cvs.service';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { MoveSectionDto } from '../dto/move-section.dto';
import { SectionsErrors } from '../sections.errors';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(CvSectionEntity)
    private readonly sectionRepository: Repository<CvSectionEntity>,
    private readonly cvsService: CvsService,
  ) {}

  /**
   * List all sections for a CV in order.
   * First line: ownership gate via CvsService.
   */
  async list(cvId: string, userId: string): Promise<CvSectionEntity[]> {
    // Ownership gate: throws 404 or 403 if unauthorized
    await this.cvsService.findOne(cvId, userId);

    const sections = await this.sectionRepository.find({
      where: { cvId },
      order: { orderIndex: 'ASC' },
    });

    return sections;
  }

  /**
   * Create a new section within a CV.
   * orderIndex is assigned as max + 1 to append at the end.
   * First line: ownership gate via CvsService.
   */
  async create(
    cvId: string,
    userId: string,
    dto: CreateSectionDto,
  ): Promise<CvSectionEntity> {
    // Ownership gate: throws 404 or 403 if unauthorized
    await this.cvsService.findOne(cvId, userId);

    // Find the maximum orderIndex in this CV
    const lastSection = await this.sectionRepository.findOne({
      where: { cvId },
      order: { orderIndex: 'DESC' },
    });

    const nextOrderIndex = lastSection ? lastSection.orderIndex + 1 : 0;

    const section = this.sectionRepository.create({
      cvId,
      type: dto.type,
      orderIndex: nextOrderIndex,
      content: dto.content || {},
    });

    return this.sectionRepository.save(section);
  }

  /**
   * Find a specific section by ID and CV ID.
   * First line: ownership gate via CvsService.
   */
  async findOne(
    cvId: string,
    id: string,
    userId: string,
  ): Promise<CvSectionEntity> {
    // Ownership gate: throws 404 or 403 if unauthorized
    await this.cvsService.findOne(cvId, userId);

    const section = await this.sectionRepository.findOne({
      where: { id, cvId },
    });

    if (!section) {
      throw SectionsErrors.sectionNotFound();
    }

    return section;
  }

  /**
   * Update a section's content.
   * First line: ownership gate via CvsService.
   */
  async update(
    cvId: string,
    id: string,
    userId: string,
    dto: UpdateSectionDto,
  ): Promise<CvSectionEntity> {
    // Ownership gate: throws 404 or 403 if unauthorized
    await this.cvsService.findOne(cvId, userId);

    const section = await this.sectionRepository.findOne({
      where: { id, cvId },
    });

    if (!section) {
      throw SectionsErrors.sectionNotFound();
    }

    section.content = dto.content;
    section.updatedOnUtc = new Date();

    return this.sectionRepository.save(section);
  }

  /**
   * Delete a section and reindex subsequent sections.
   * First line: ownership gate via CvsService.
   */
  async remove(cvId: string, id: string, userId: string): Promise<void> {
    // Ownership gate: throws 404 or 403 if unauthorized
    await this.cvsService.findOne(cvId, userId);

    const section = await this.sectionRepository.findOne({
      where: { id, cvId },
    });

    if (!section) {
      throw SectionsErrors.sectionNotFound();
    }

    const deletedOrderIndex = section.orderIndex;

    // Delete the section
    await this.sectionRepository.delete({ id });

    // Reindex: decrement orderIndex for all sections after the deleted one
    await this.sectionRepository
      .createQueryBuilder()
      .update(CvSectionEntity)
      .set({ orderIndex: () => 'order_index - 1' })
      .where('cv_id = :cvId', { cvId })
      .andWhere('order_index > :deletedOrderIndex', { deletedOrderIndex })
      .execute();
  }

  /**
   * Move a section up or down by swapping orderIndex with its neighbor.
   * Persists both rows in a single save call.
   * First line: ownership gate via CvsService.
   */
  async move(
    cvId: string,
    id: string,
    userId: string,
    dto: MoveSectionDto,
  ): Promise<CvSectionEntity[]> {
    // Ownership gate: throws 404 or 403 if unauthorized
    await this.cvsService.findOne(cvId, userId);

    // Load current section
    const current = await this.sectionRepository.findOne({
      where: { id, cvId },
    });

    if (!current) {
      throw SectionsErrors.sectionNotFound();
    }

    // Compute target orderIndex
    const targetOrderIndex =
      dto.direction === 'up' ? current.orderIndex - 1 : current.orderIndex + 1;

    // Boundary check
    if (targetOrderIndex < 0) {
      throw SectionsErrors.cannotMoveFirst();
    }

    // Load neighbor
    const neighbor = await this.sectionRepository.findOne({
      where: { cvId, orderIndex: targetOrderIndex },
    });

    if (!neighbor) {
      throw SectionsErrors.cannotMoveLast();
    }

    // Swap orderIndex values
    const tempOrderIndex = current.orderIndex;
    current.orderIndex = neighbor.orderIndex;
    neighbor.orderIndex = tempOrderIndex;

    // Persist both rows in one call
    const saved = await this.sectionRepository.save([current, neighbor]);

    return saved;
  }
}
