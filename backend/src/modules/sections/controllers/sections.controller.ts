import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { CurrentUserContext } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { SectionsService } from '../services/sections.service';
import { CvSectionEntity } from '../entities/cv-section.entity';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { MoveSectionDto } from '../dto/move-section.dto';

@Controller('cvs/:cvId/sections')
@ApiTags('Sections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  /**
   * List all sections for a CV (sorted by orderIndex).
   */
  @Get()
  @ApiOperation({
    summary: 'List sections in a CV',
    description:
      'Retrieve all sections for a specific CV, sorted by order index.',
  })
  @ApiOkResponse({
    description: 'Sections retrieved successfully',
    type: [CvSectionEntity],
  })
  @ApiNotFoundResponse({
    description: 'CV not found or not owned by user',
  })
  @ApiForbiddenResponse({
    description: 'You do not own this CV',
  })
  async list(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('cvId') cvId: string,
  ): Promise<CvSectionEntity[]> {
    return this.sectionsService.list(cvId, currentUser.userId);
  }

  /**
   * Create a new section within a CV.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a section',
    description:
      'Create a new section within a CV. Order index is auto-assigned.',
  })
  @ApiCreatedResponse({
    description: 'Section created successfully',
    type: CvSectionEntity,
  })
  @ApiNotFoundResponse({
    description: 'CV not found or not owned by user',
  })
  @ApiForbiddenResponse({
    description: 'You do not own this CV',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  async create(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('cvId') cvId: string,
    @Body() dto: CreateSectionDto,
  ): Promise<CvSectionEntity> {
    return this.sectionsService.create(cvId, currentUser.userId, dto);
  }

  /**
   * Get a specific section by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a section',
    description: 'Retrieve a specific section by its ID.',
  })
  @ApiOkResponse({
    description: 'Section retrieved successfully',
    type: CvSectionEntity,
  })
  @ApiNotFoundResponse({
    description: 'Section or CV not found',
  })
  @ApiForbiddenResponse({
    description: 'You do not own this CV',
  })
  async findOne(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('cvId') cvId: string,
    @Param('id') id: string,
  ): Promise<CvSectionEntity> {
    return this.sectionsService.findOne(cvId, id, currentUser.userId);
  }

  /**
   * Update a section's content.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a section',
    description: 'Update the content of a section.',
  })
  @ApiOkResponse({
    description: 'Section updated successfully',
    type: CvSectionEntity,
  })
  @ApiNotFoundResponse({
    description: 'Section or CV not found',
  })
  @ApiForbiddenResponse({
    description: 'You do not own this CV',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  async update(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('cvId') cvId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ): Promise<CvSectionEntity> {
    return this.sectionsService.update(cvId, id, currentUser.userId, dto);
  }

  /**
   * Delete a section (and reindex subsequent sections).
   */
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a section',
    description:
      'Delete a section. Subsequent sections are reindexed automatically.',
  })
  @ApiNotFoundResponse({
    description: 'Section or CV not found',
  })
  @ApiForbiddenResponse({
    description: 'You do not own this CV',
  })
  async remove(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('cvId') cvId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.sectionsService.remove(cvId, id, currentUser.userId);
  }

  /**
   * Move a section up or down (swap with neighbor).
   */
  @Post(':id/move')
  @ApiOperation({
    summary: 'Move a section',
    description:
      'Move a section up or down within the CV by swapping with its neighbor.',
  })
  @ApiOkResponse({
    description: 'Section moved successfully; returns both swapped sections',
    type: [CvSectionEntity],
  })
  @ApiNotFoundResponse({
    description: 'Section or CV not found',
  })
  @ApiForbiddenResponse({
    description: 'You do not own this CV',
  })
  @ApiBadRequestResponse({
    description:
      'Cannot move (already first/last section) or invalid direction',
  })
  async move(
    @CurrentUser() currentUser: CurrentUserContext,
    @Param('cvId') cvId: string,
    @Param('id') id: string,
    @Body() dto: MoveSectionDto,
  ): Promise<CvSectionEntity[]> {
    return this.sectionsService.move(cvId, id, currentUser.userId, dto);
  }
}
