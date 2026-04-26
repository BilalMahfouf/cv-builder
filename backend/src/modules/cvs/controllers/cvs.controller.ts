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
import { SWAGGER_BEARER_AUTH_NAME } from '../../../common/swagger/swagger.responses';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { CurrentUserContext } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CvsService } from '../services/cvs.service';
import { CvEntity } from '../entities/cv.entity';
import { CreateCvDto } from '../dto/create-cv.dto';
import { UpdateCvDto } from '../dto/update-cv.dto';
import { SaveGuestCvDto } from '../dto/save-guest-cv.dto';

@Controller('cvs')
@ApiTags('CVs')
export class CvsController {
    constructor(private readonly cvsService: CvsService) { }

    /**
     * PUBLIC ENDPOINT: Get CV by slug (no auth required).
     * IMPORTANT: This route is declared BEFORE /:id to prevent slug values
     * from being misinterpreted as UUIDs by the route matching.
     */
    @Get('public/:slug')
    @ApiOperation({
        summary: 'Get CV by public slug',
        description:
            'Retrieve a CV using its public slug. No authentication required.',
    })
    @ApiOkResponse({
        description: 'CV retrieved successfully',
        type: CvEntity,
    })
    @ApiNotFoundResponse({
        description: 'CV with this slug not found',
    })
    async getPublicBySlug(@Param('slug') slug: string): Promise<CvEntity> {
        return this.cvsService.findPublicBySlug(slug);
    }

    /**
     * Create a new CV for the authenticated user.
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Create a new CV',
        description:
            'Create a new CV for the authenticated user. Slug is auto-generated.',
    })
    @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
    @ApiCreatedResponse({
        description: 'CV created successfully',
        type: CvEntity,
    })
    @ApiBadRequestResponse({
        description: 'Invalid request body',
    })
    async create(
        @CurrentUser() currentUser: CurrentUserContext,
        @Body() dto: CreateCvDto,
    ): Promise<CvEntity> {
        return this.cvsService.create(currentUser.userId, dto);
    }

    /**
     * List all CVs for the authenticated user.
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'List all CVs',
        description: 'Retrieve all CVs belonging to the authenticated user.',
    })
    @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
    @ApiOkResponse({
        description: 'CVs retrieved successfully',
        type: [CvEntity],
    })
    async findAll(
        @CurrentUser() currentUser: CurrentUserContext,
    ): Promise<CvEntity[]> {
        return this.cvsService.findAll(currentUser.userId);
    }

    /**
     * Guest save: Create a CV with all its sections atomically.
     * This endpoint accepts the full CV payload from sessionStorage.
     */
    @Post('guest-save')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Save CV from guest session',
        description:
            'Atomically create a CV and all its sections from a sessionStorage payload. ' +
            'Both CV and sections are persisted in a single transaction.',
    })
    @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
    @ApiCreatedResponse({
        description: 'CV and sections saved successfully',
        type: CvEntity,
    })
    @ApiBadRequestResponse({
        description: 'Invalid CV or section payload',
    })
    async guestSave(
        @CurrentUser() currentUser: CurrentUserContext,
        @Body() dto: SaveGuestCvDto,
    ): Promise<CvEntity> {
        return this.cvsService.saveGuest(currentUser.userId, dto);
    }

    /**
     * Get a specific CV by ID (with IDOR protection).
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get CV by ID',
        description: 'Retrieve a specific CV by its ID. User must own the CV.',
    })
    @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
    @ApiOkResponse({
        description: 'CV retrieved successfully',
        type: CvEntity,
    })
    @ApiNotFoundResponse({
        description: 'CV not found',
    })
    @ApiForbiddenResponse({
        description: 'You do not own this CV',
    })
    async findOne(
        @CurrentUser() currentUser: CurrentUserContext,
        @Param('id') id: string,
    ): Promise<CvEntity> {
        return this.cvsService.findOne(id, currentUser.userId);
    }

    /**
     * Update CV title.
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Update CV',
        description: 'Update the title of a CV. User must own the CV.',
    })
    @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
    @ApiOkResponse({
        description: 'CV updated successfully',
        type: CvEntity,
    })
    @ApiNotFoundResponse({
        description: 'CV not found',
    })
    @ApiForbiddenResponse({
        description: 'You do not own this CV',
    })
    @ApiBadRequestResponse({
        description: 'Invalid request body',
    })
    async update(
        @CurrentUser() currentUser: CurrentUserContext,
        @Param('id') id: string,
        @Body() dto: UpdateCvDto,
    ): Promise<CvEntity> {
        return this.cvsService.update(id, currentUser.userId, dto);
    }

    /**
     * Delete a CV (and all its sections).
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    @ApiOperation({
        summary: 'Delete CV',
        description: 'Delete a CV and all its sections. User must own the CV.',
    })
    @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
    @ApiNotFoundResponse({
        description: 'CV not found',
    })
    @ApiForbiddenResponse({
        description: 'You do not own this CV',
    })
    async remove(
        @CurrentUser() currentUser: CurrentUserContext,
        @Param('id') id: string,
    ): Promise<void> {
        await this.cvsService.remove(id, currentUser.userId);
    }
}
