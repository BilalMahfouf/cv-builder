import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { SectionsService } from '../../../src/modules/sections/services/sections.service';
import { CvSectionEntity } from '../../../src/modules/sections/entities/cv-section.entity';
import { SectionType } from '../../../src/modules/sections/entities/section-type.enum';
import { CvsService } from '../../../src/modules/cvs/services/cvs.service';

describe('SectionsService', () => {
    const sectionRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const cvsService = {
        findOne: jest.fn(),
    };

    let service: SectionsService;

    beforeEach(() => {
        jest.clearAllMocks();
        cvsService.findOne.mockResolvedValue({ id: 'cv-1', userId: 'user-1' });

        service = new SectionsService(
            sectionRepository as unknown as Repository<CvSectionEntity>,
            cvsService as unknown as CvsService,
        );
    });

    it('should list sections when cv ownership check passes', async () => {
        const rows = [{ id: 's-1' }, { id: 's-2' }] as CvSectionEntity[];
        sectionRepository.find.mockResolvedValue(rows);

        const result = await service.list('cv-1', 'user-1');

        expect(cvsService.findOne).toHaveBeenCalledWith('cv-1', 'user-1');
        expect(sectionRepository.find).toHaveBeenCalledWith({
            where: { cvId: 'cv-1' },
            order: { orderIndex: 'ASC' },
        });
        expect(result).toEqual(rows);
    });

    it('should append section at index zero when create is called and no section exists', async () => {
        const created = {
            cvId: 'cv-1',
            type: SectionType.PERSONAL_INFO,
            orderIndex: 0,
            content: { fullName: 'John Doe' },
        } as CvSectionEntity;

        sectionRepository.findOne.mockResolvedValue(null);
        sectionRepository.create.mockReturnValue(created);
        sectionRepository.save.mockResolvedValue({ ...created, id: 's-1' });

        const result = await service.create('cv-1', 'user-1', {
            type: SectionType.PERSONAL_INFO,
            content: { fullName: 'John Doe' },
        });

        expect(sectionRepository.create).toHaveBeenCalledWith({
            cvId: 'cv-1',
            type: SectionType.PERSONAL_INFO,
            orderIndex: 0,
            content: { fullName: 'John Doe' },
        });
        expect(result.orderIndex).toBe(0);
    });

    it('should append section at max plus one when create is called and previous section exists', async () => {
        sectionRepository.findOne.mockResolvedValue({ orderIndex: 4 });
        sectionRepository.create.mockImplementation((value: CvSectionEntity) => value);
        sectionRepository.save.mockImplementation(
            async (value: CvSectionEntity): Promise<CvSectionEntity> =>
                ({ ...value, id: 's-5' } as CvSectionEntity),
        );

        const result = await service.create('cv-1', 'user-1', {
            type: SectionType.EXPERIENCE,
            content: { company: 'Acme' },
        });

        expect(result.orderIndex).toBe(5);
    });

    it('should return section when findOne is called with existing section id', async () => {
        const row = { id: 'section-1', cvId: 'cv-1' } as CvSectionEntity;
        sectionRepository.findOne.mockResolvedValue(row);

        const result = await service.findOne('cv-1', 'section-1', 'user-1');

        expect(result).toBe(row);
    });

    it('should throw not found when findOne is called with missing section id', async () => {
        sectionRepository.findOne.mockResolvedValue(null);

        await expect(service.findOne('cv-1', 'missing', 'user-1')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('should update section content and timestamp when update is called with valid section id', async () => {
        const section = {
            id: 'section-1',
            cvId: 'cv-1',
            content: { headline: 'Old' },
            updatedOnUtc: new Date('2024-01-01T00:00:00.000Z'),
        } as CvSectionEntity;

        sectionRepository.findOne.mockResolvedValue(section);
        sectionRepository.save.mockImplementation(
            async (value: CvSectionEntity): Promise<CvSectionEntity> => value,
        );

        const result = await service.update('cv-1', 'section-1', 'user-1', {
            content: { headline: 'New' },
        });

        expect(result.content).toEqual({ headline: 'New' });
        expect(result.updatedOnUtc).toBeInstanceOf(Date);
    });

    it('should throw not found when update is called for missing section id', async () => {
        sectionRepository.findOne.mockResolvedValue(null);

        await expect(
            service.update('cv-1', 'missing', 'user-1', { content: { any: 'value' } }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should delete and reindex sections when remove is called for existing section', async () => {
        const execute = jest.fn().mockResolvedValue(undefined);
        const andWhere = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ andWhere });
        const set = jest.fn().mockReturnValue({ where });
        const update = jest.fn().mockReturnValue({ set });

        sectionRepository.findOne.mockResolvedValue({
            id: 'section-2',
            cvId: 'cv-1',
            orderIndex: 1,
        } as CvSectionEntity);
        sectionRepository.delete.mockResolvedValue(undefined);
        sectionRepository.createQueryBuilder.mockReturnValue({ update });

        await service.remove('cv-1', 'section-2', 'user-1');

        expect(sectionRepository.delete).toHaveBeenCalledWith({ id: 'section-2' });
        expect(update).toHaveBeenCalledWith(CvSectionEntity);
        expect(set).toHaveBeenCalledWith({ orderIndex: expect.any(Function) });
        expect(where).toHaveBeenCalledWith('cv_id = :cvId', { cvId: 'cv-1' });
        expect(andWhere).toHaveBeenCalledWith('order_index > :deletedOrderIndex', {
            deletedOrderIndex: 1,
        });
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it('should throw not found when remove is called for missing section id', async () => {
        sectionRepository.findOne.mockResolvedValue(null);

        await expect(service.remove('cv-1', 'missing', 'user-1')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('should swap neighboring sections when move is called with direction up', async () => {
        const current = {
            id: 'section-2',
            cvId: 'cv-1',
            orderIndex: 1,
            type: SectionType.EXPERIENCE,
        } as CvSectionEntity;
        const neighbor = {
            id: 'section-1',
            cvId: 'cv-1',
            orderIndex: 0,
            type: SectionType.PERSONAL_INFO,
        } as CvSectionEntity;

        sectionRepository.findOne
            .mockResolvedValueOnce(current)
            .mockResolvedValueOnce(neighbor);
        sectionRepository.save.mockImplementation(
            async (value: CvSectionEntity): Promise<CvSectionEntity> => value,
        );

        const result = await service.move('cv-1', 'section-2', 'user-1', {
            direction: 'up',
        });

        expect(sectionRepository.save).toHaveBeenCalledTimes(3);
        expect((sectionRepository.save.mock.calls[0][0] as CvSectionEntity).id).toBe(
            'section-2',
        );
        expect((sectionRepository.save.mock.calls[1][0] as CvSectionEntity).id).toBe(
            'section-1',
        );
        expect((sectionRepository.save.mock.calls[2][0] as CvSectionEntity).id).toBe(
            'section-2',
        );
        expect(result.find((item) => item.id === 'section-2')?.orderIndex).toBe(0);
        expect(result.find((item) => item.id === 'section-1')?.orderIndex).toBe(1);
    });

    it('should throw bad request when move is called up for first section', async () => {
        sectionRepository.findOne.mockResolvedValue({
            id: 'section-1',
            cvId: 'cv-1',
            orderIndex: 0,
        } as CvSectionEntity);

        await expect(
            service.move('cv-1', 'section-1', 'user-1', { direction: 'up' }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw bad request when move is called down for last section', async () => {
        sectionRepository.findOne
            .mockResolvedValueOnce({
                id: 'section-3',
                cvId: 'cv-1',
                orderIndex: 2,
            } as CvSectionEntity)
            .mockResolvedValueOnce(null);

        await expect(
            service.move('cv-1', 'section-3', 'user-1', { direction: 'down' }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw not found when move is called for missing section id', async () => {
        sectionRepository.findOne.mockResolvedValue(null);

        await expect(
            service.move('cv-1', 'missing', 'user-1', { direction: 'down' }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
