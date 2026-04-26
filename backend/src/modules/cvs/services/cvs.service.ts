import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { CvEntity } from '../entities/cv.entity';
import { CvSectionEntity } from '../../sections/entities/cv-section.entity';
import { CreateCvDto } from '../dto/create-cv.dto';
import { UpdateCvDto } from '../dto/update-cv.dto';
import {
  SaveGuestCvDto,
  SaveGuestSectionItemDto,
} from '../dto/save-guest-cv.dto';
import { CvsErrors } from '../cvs.errors';

const SLUG_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const SLUG_LENGTH = 10;

const generateSlugCandidate = (): string => {
  const bytes = randomBytes(SLUG_LENGTH);
  let slug = '';

  for (let index = 0; index < SLUG_LENGTH; index++) {
    slug += SLUG_ALPHABET[bytes[index] % SLUG_ALPHABET.length];
  }

  return slug;
};

@Injectable()
export class CvsService {
  constructor(
    @InjectRepository(CvEntity)
    private readonly cvRepository: Repository<CvEntity>,
    @InjectRepository(CvSectionEntity)
    private readonly sectionRepository: Repository<CvSectionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new CV for the authenticated user.
   * Slug is generated server-side and must be unique.
   */
  async create(userId: string, dto: CreateCvDto): Promise<CvEntity> {
    const slug = await this.generateUniqueSlug();
    const cv = this.cvRepository.create({
      userId,
      slug,
      title: dto.title || 'Untitled CV',
    });
    return this.cvRepository.save(cv);
  }

  /**
   * List all CVs belonging to the authenticated user.
   */
  async findAll(userId: string): Promise<CvEntity[]> {
    return this.cvRepository.find({
      where: { userId },
      relations: ['sections'],
      order: { createdOnUtc: 'DESC' },
    });
  }

  /**
   * Find a specific CV by ID with IDOR protection.
   * If CV does not exist: NotFoundException.
   * If CV exists but userId != requester: ForbiddenException.
   */
  async findOne(cvId: string, userId: string): Promise<CvEntity> {
    const cv = await this.cvRepository.findOne({
      where: { id: cvId },
      relations: ['sections'],
    });

    if (!cv) {
      throw CvsErrors.cvNotFound();
    }

    if (cv.userId !== userId) {
      throw CvsErrors.cvNotOwnedByUser();
    }

    // Sort sections by orderIndex for deterministic ordering
    if (cv.sections) {
      cv.sections.sort(
        (a: CvSectionEntity, b: CvSectionEntity) => a.orderIndex - b.orderIndex,
      );
    }

    return cv;
  }

  /**
   * Find a CV by its public slug (no auth required).
   * Anyone can read a CV by its slug; ownership is not checked here.
   */
  async findPublicBySlug(slug: string): Promise<CvEntity> {
    const cv = await this.cvRepository.findOne({
      where: { slug },
      relations: ['sections'],
    });

    if (!cv) {
      throw CvsErrors.cvNotFound();
    }

    // Sort sections by orderIndex for deterministic ordering
    if (cv.sections) {
      cv.sections.sort(
        (a: CvSectionEntity, b: CvSectionEntity) => a.orderIndex - b.orderIndex,
      );
    }

    return cv;
  }

  /**
   * Update CV title with IDOR protection.
   */
  async update(
    cvId: string,
    userId: string,
    dto: UpdateCvDto,
  ): Promise<CvEntity> {
    // IDOR check: verify ownership before mutation
    await this.findOne(cvId, userId);

    const cv = await this.cvRepository.findOneBy({ id: cvId });
    if (!cv) {
      throw CvsErrors.cvNotFound();
    }

    cv.title = dto.title;
    cv.updatedOnUtc = new Date();
    return this.cvRepository.save(cv);
  }

  /**
   * Delete a CV (and all its sections) with IDOR protection.
   */
  async remove(cvId: string, userId: string): Promise<void> {
    // IDOR check: verify ownership before mutation
    await this.findOne(cvId, userId);

    await this.cvRepository.delete({ id: cvId });
  }

  /**
   * Guest save: atomically create a CV and all its sections from sessionStorage payload.
   * Uses a single transaction to ensure both CV and sections succeed or both rollback.
   */
  async saveGuest(userId: string, dto: SaveGuestCvDto): Promise<CvEntity> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // Generate unique slug within this transaction
      const slug = await this.generateUniqueSlug(manager);

      // Create CV entity
      const cv = new CvEntity();
      cv.userId = userId;
      cv.slug = slug;
      cv.title = dto.title || 'Untitled CV';
      cv.sections = [];

      const savedCv = await manager.getRepository(CvEntity).save(cv);

      // Process incoming sections: sort by orderIndex and rebuild contiguous indexes
      const sortedSections = dto.sections.sort(
        (a: SaveGuestSectionItemDto, b: SaveGuestSectionItemDto) =>
          a.orderIndex - b.orderIndex,
      );
      const sections: CvSectionEntity[] = [];

      for (let i = 0; i < sortedSections.length; i++) {
        const sectionItem = sortedSections[i];
        const section = new CvSectionEntity();
        section.cvId = savedCv.id;
        section.type = sectionItem.type;
        section.orderIndex = i; // Rebuild contiguous index

        section.content = sectionItem.content || {};

        sections.push(section);
      }

      // Save all sections in one call
      const savedSections = await manager
        .getRepository(CvSectionEntity)
        .save(sections);

      // Return CV with sections populated and sorted
      savedCv.sections = savedSections;
      return savedCv;
    });
  }

  /**
   * Generate a unique slug using a 10-char base36 candidate.
   * Checks for collisions and retries if needed.
   */
  async generateUniqueSlug(manager?: EntityManager): Promise<string> {
    const repo = manager ? manager.getRepository(CvEntity) : this.cvRepository;

    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateSlugCandidate();
      const existing = await repo.findOneBy({ slug: candidate });

      if (!existing) {
        return candidate;
      }
    }

    throw CvsErrors.slugAlreadyInUse();
  }
}
