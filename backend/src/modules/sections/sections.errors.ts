import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export const SectionsErrors = {
  sectionNotFound(): NotFoundException {
    return new NotFoundException({
      code: 'Section.NotFound',
      message: 'Section not found',
    });
  },

  cvNotFound(): NotFoundException {
    return new NotFoundException({
      code: 'Section.CvNotFound',
      message: 'CV not found',
    });
  },

  cvNotOwnedByUser(): ForbiddenException {
    return new ForbiddenException({
      code: 'Section.CvNotOwnedByUser',
      message: 'You do not have permission to access sections in this CV',
    });
  },

  cannotMoveFirst(): BadRequestException {
    return new BadRequestException({
      code: 'Section.CannotMoveFirst',
      message: 'Cannot move section up; it is already the first section',
    });
  },

  cannotMoveLast(): BadRequestException {
    return new BadRequestException({
      code: 'Section.CannotMoveLast',
      message: 'Cannot move section down; it is already the last section',
    });
  },

  invalidMoveDirection(): BadRequestException {
    return new BadRequestException({
      code: 'Section.InvalidMoveDirection',
      message: 'Invalid move direction; must be "up" or "down"',
    });
  },

  invalidContentForType(): BadRequestException {
    return new BadRequestException({
      code: 'Section.InvalidContentForType',
      message:
        'Content does not match the expected shape for this section type',
    });
  },
};
