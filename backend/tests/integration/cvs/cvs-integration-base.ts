import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { CvEntity } from '../../../src/modules/cvs/entities/cv.entity';
import { CvSectionEntity } from '../../../src/modules/sections/entities/cv-section.entity';
import { SectionType } from '../../../src/modules/sections/entities/section-type.enum';
import { UserEntity } from '../../../src/modules/users/entities/user.entity';
import { UsersIntegrationBase } from '../users/users-integration-base';

export abstract class CvsIntegrationBase extends UsersIntegrationBase {
    protected get cvsRepository(): Repository<CvEntity> {
        return this.dataSource.getRepository(CvEntity);
    }

    protected get sectionsRepository(): Repository<CvSectionEntity> {
        return this.dataSource.getRepository(CvSectionEntity);
    }

    protected override async resetDatabase(): Promise<void> {
        await this.dataSource.query(
            'TRUNCATE TABLE cv_sections, cvs, payments, user_sessions, users RESTART IDENTITY CASCADE',
        );
    }

    protected async seedCv(params: {
        user: UserEntity;
        title?: string;
        slug?: string;
    }): Promise<CvEntity> {
        const slug = params.slug ?? randomUUID().replace(/-/g, '').slice(0, 10);

        const cv = this.cvsRepository.create({
            userId: params.user.id,
            slug,
            title: params.title ?? 'Untitled CV',
        });

        return this.cvsRepository.save(cv);
    }

    protected async seedSection(params: {
        cv: CvEntity;
        type?: SectionType;
        orderIndex: number;
        content?: Record<string, unknown>;
    }): Promise<CvSectionEntity> {
        const section = this.sectionsRepository.create({
            cvId: params.cv.id,
            type: params.type ?? SectionType.CUSTOM,
            orderIndex: params.orderIndex,
            content: params.content ?? {},
        });

        return this.sectionsRepository.save(section);
    }
}
