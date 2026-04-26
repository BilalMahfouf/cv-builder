import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { CvsService } from '../../../src/modules/cvs/services/cvs.service';
import { CvEntity } from '../../../src/modules/cvs/entities/cv.entity';
import { CvSectionEntity } from '../../../src/modules/sections/entities/cv-section.entity';
import { SectionType } from '../../../src/modules/sections/entities/section-type.enum';

describe('CvsService', () => {
    const cvRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        delete: jest.fn(),
    };

    const sectionRepository = {
        save: jest.fn(),
    };

    const dataSource = {
        transaction: jest.fn(),
    };

    let service: CvsService;

    beforeEach(() => {
        jest.clearAllMocks();

        service = new CvsService(
            cvRepository as unknown as Repository<CvEntity>,
            sectionRepository as unknown as Repository<CvSectionEntity>,
            dataSource as unknown as DataSource,
        );
    });

    it('should create a cv when user id and dto are valid', async () => {
        const created = {
            userId: 'user-1',
            slug: 'abc123def4',
            title: 'Backend CV',
        } as CvEntity;
        const saved = { ...created, id: 'cv-1' } as CvEntity;

        jest.spyOn(service, 'generateUniqueSlug').mockResolvedValue('abc123def4');
        cvRepository.create.mockReturnValue(created);
        cvRepository.save.mockResolvedValue(saved);

        const result = await service.create('user-1', { title: 'Backend CV' });

        expect(cvRepository.create).toHaveBeenCalledWith({
            userId: 'user-1',
            slug: 'abc123def4',
            title: 'Backend CV',
        });
        expect(cvRepository.save).toHaveBeenCalledWith(created);
        expect(result).toEqual(saved);
    });

    it('should return all cvs when findAll is called', async () => {
        const rows = [{ id: 'cv-1' }, { id: 'cv-2' }] as CvEntity[];
        cvRepository.find.mockResolvedValue(rows);

        const result = await service.findAll('user-1');

        expect(cvRepository.find).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            relations: ['sections'],
            order: { createdOnUtc: 'DESC' },
        });
        expect(result).toEqual(rows);
    });

    it('should return cv with sections sorted by order index when findOne is called by owner', async () => {
        const cv = {
            id: 'cv-1',
            userId: 'user-1',
            sections: [
                { id: 's-2', orderIndex: 2 },
                { id: 's-0', orderIndex: 0 },
                { id: 's-1', orderIndex: 1 },
            ],
        } as CvEntity;

        cvRepository.findOne.mockResolvedValue(cv);

        const result = await service.findOne('cv-1', 'user-1');

        expect(result.sections.map((section) => section.orderIndex)).toEqual([0, 1, 2]);
    });

    it('should throw not found when findOne is called for missing cv id', async () => {
        cvRepository.findOne.mockResolvedValue(null);

        await expect(service.findOne('missing-cv', 'user-1')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('should throw forbidden when findOne is called by non owner', async () => {
        cvRepository.findOne.mockResolvedValue({
            id: 'cv-1',
            userId: 'user-2',
            sections: [],
        } as CvEntity);

        await expect(service.findOne('cv-1', 'user-1')).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });

    it('should return cv with sections sorted when findPublicBySlug is called with an existing slug', async () => {
        cvRepository.findOne.mockResolvedValue({
            id: 'cv-1',
            userId: 'user-1',
            slug: 'abc123def4',
            sections: [
                { id: 's-3', orderIndex: 3 },
                { id: 's-1', orderIndex: 1 },
            ],
        } as CvEntity);

        const result = await service.findPublicBySlug('abc123def4');

        expect(result.sections.map((section) => section.orderIndex)).toEqual([1, 3]);
    });

    it('should throw not found when findPublicBySlug is called with unknown slug', async () => {
        cvRepository.findOne.mockResolvedValue(null);

        await expect(service.findPublicBySlug('missing')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('should update cv title when update is called with valid data', async () => {
        const row = {
            id: 'cv-1',
            userId: 'user-1',
            title: 'Old Title',
            updatedOnUtc: new Date('2025-01-01T00:00:00.000Z'),
        } as CvEntity;

        jest.spyOn(service, 'findOne').mockResolvedValue(row);
        cvRepository.findOneBy.mockResolvedValue(row);
        cvRepository.save.mockResolvedValue({ ...row, title: 'New Title' });

        const result = await service.update('cv-1', 'user-1', { title: 'New Title' });

        expect(service.findOne).toHaveBeenCalledWith('cv-1', 'user-1');
        expect(result.title).toBe('New Title');
        expect(row.updatedOnUtc).toBeInstanceOf(Date);
    });

    it('should throw not found when update is called and cv disappears after ownership check', async () => {
        jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'cv-1' } as CvEntity);
        cvRepository.findOneBy.mockResolvedValue(null);

        await expect(
            service.update('cv-1', 'user-1', { title: 'New Title' }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should delete cv when remove is called by owner', async () => {
        jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'cv-1' } as CvEntity);
        cvRepository.delete.mockResolvedValue(undefined);

        await service.remove('cv-1', 'user-1');

        expect(service.findOne).toHaveBeenCalledWith('cv-1', 'user-1');
        expect(cvRepository.delete).toHaveBeenCalledWith({ id: 'cv-1' });
    });

    it('should save guest cv and rebuild contiguous section indexes when saveGuest is called', async () => {
        const cvManagerRepo = {
            findOneBy: jest.fn(),
            save: jest.fn(),
        };
        const sectionManagerRepo = {
            save: jest.fn(),
        };

        const manager = {
            getRepository: jest.fn((entity: unknown) => {
                if (entity === CvEntity) {
                    return cvManagerRepo;
                }

                return sectionManagerRepo;
            }),
        } as unknown as EntityManager;

        const savedCv = {
            id: 'cv-guest-1',
            userId: 'user-1',
            slug: 'abc123def4',
            title: 'Imported CV',
            sections: [],
        } as CvEntity;

        cvManagerRepo.save.mockResolvedValue(savedCv);
        sectionManagerRepo.save.mockImplementation(
            async (sections: CvSectionEntity[]): Promise<CvSectionEntity[]> =>
                sections.map((section, index) => ({
                    ...section,
                    id: `section-${index + 1}`,
                } as CvSectionEntity)),
        );

        dataSource.transaction.mockImplementation(
            async (callback: (txManager: EntityManager) => Promise<CvEntity>) =>
                callback(manager),
        );

        jest.spyOn(service, 'generateUniqueSlug').mockResolvedValue('abc123def4');

        const result = await service.saveGuest('user-1', {
            title: 'Imported CV',
            sections: [
                {
                    type: SectionType.EXPERIENCE,
                    orderIndex: 5,
                    content: { company: 'Acme' },
                },
                {
                    type: SectionType.PERSONAL_INFO,
                    orderIndex: 2,
                    content: { fullName: 'John Doe' },
                },
            ],
        });

        expect(result.id).toBe('cv-guest-1');
        expect(result.sections).toHaveLength(2);
        expect(result.sections.map((section) => section.orderIndex)).toEqual([0, 1]);
        expect(service.generateUniqueSlug).toHaveBeenCalledWith(manager);
    });

    it('should return slug when generateUniqueSlug finds available candidate on first attempt', async () => {
        cvRepository.findOneBy.mockResolvedValue(null);

        const slug = await service.generateUniqueSlug();

        expect(slug).toEqual(expect.any(String));
        expect(slug).toHaveLength(10);
        expect(cvRepository.findOneBy).toHaveBeenCalledTimes(1);
    });

    it('should use manager repository when generateUniqueSlug is called with manager', async () => {
        const managerRepo = {
            findOneBy: jest.fn().mockResolvedValue(null),
        };
        const manager = {
            getRepository: jest.fn().mockReturnValue(managerRepo),
        } as unknown as EntityManager;

        const slug = await service.generateUniqueSlug(manager);

        expect(slug).toEqual(expect.any(String));
        expect(manager.getRepository).toHaveBeenCalledWith(CvEntity);
        expect(managerRepo.findOneBy).toHaveBeenCalledTimes(1);
    });

    it('should throw bad request when generateUniqueSlug collides for all retries', async () => {
        cvRepository.findOneBy.mockResolvedValue({ id: 'existing-cv' });

        await expect(service.generateUniqueSlug()).rejects.toBeInstanceOf(
            BadRequestException,
        );
        expect(cvRepository.findOneBy).toHaveBeenCalledTimes(10);
    });
});
