import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export const CvsErrors = {
  cvNotFound(): NotFoundException {
    return new NotFoundException({
      code: 'Cv.NotFound',
      message: 'CV not found',
    });
  },

  cvNotOwnedByUser(): ForbiddenException {
    return new ForbiddenException({
      code: 'Cv.NotOwnedByUser',
      message: 'You do not have permission to access this CV',
    });
  },

  slugAlreadyInUse(): BadRequestException {
    return new BadRequestException({
      code: 'Cv.SlugAlreadyInUse',
      message: 'This slug is already in use',
    });
  },

  invalidSectionPayload(): BadRequestException {
    return new BadRequestException({
      code: 'Cv.InvalidSectionPayload',
      message: 'One or more sections have invalid content for their type',
    });
  },
};
