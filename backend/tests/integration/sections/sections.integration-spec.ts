import { randomUUID } from 'node:crypto';
import { SectionType } from '../../../src/modules/sections/entities/section-type.enum';
import { CvsIntegrationBase } from '../cvs/cvs-integration-base';

jest.setTimeout(180_000);

class SectionsIntegrationSuite extends CvsIntegrationBase { }

const suite = new SectionsIntegrationSuite();

describe('Sections integration', () => {
    beforeAll(async () => {
        await suite.initialize();
    });

    beforeEach(async () => {
        await suite.resetDatabase();
    });

    afterAll(async () => {
        await suite.dispose();
    });

    it('should list sections sorted by order when owner requests section list', async () => {
        const user = await suite.seedUser({
            email: 'sections-list-owner@example.com',
            userName: 'sectionsListOwner',
        });
        const cv = await suite.seedCv({ user, title: 'Sections CV' });

        await suite.seedSection({
            cv,
            type: SectionType.EXPERIENCE,
            orderIndex: 2,
            content: { company: 'Acme' },
        });
        await suite.seedSection({
            cv,
            type: SectionType.PERSONAL_INFO,
            orderIndex: 0,
            content: { fullName: 'Jane Doe' },
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .get(`/api/v1/cvs/${cv.id}/sections`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .expect(200);

        expect(response.body).toHaveLength(2);
        expect(response.body.map((section: { orderIndex: number }) => section.orderIndex)).toEqual(
            [0, 2],
        );
    });

    it('should append section at end when create endpoint is called', async () => {
        const user = await suite.seedUser({
            email: 'sections-create-owner@example.com',
            userName: 'sectionsCreateOwner',
        });
        const cv = await suite.seedCv({ user, title: 'Create Section CV' });

        await suite.seedSection({
            cv,
            type: SectionType.PERSONAL_INFO,
            orderIndex: 0,
            content: { fullName: 'John Doe' },
        });
        await suite.seedSection({
            cv,
            type: SectionType.EXPERIENCE,
            orderIndex: 1,
            content: { company: 'Acme' },
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .post(`/api/v1/cvs/${cv.id}/sections`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({
                type: SectionType.EDUCATION,
                content: { school: 'MIT' },
            })
            .expect(201);

        expect(response.body.orderIndex).toBe(2);
        expect(response.body.type).toBe(SectionType.EDUCATION);
    });

    it('should return not found when section id does not exist', async () => {
        const user = await suite.seedUser({
            email: 'sections-find-missing-owner@example.com',
            userName: 'sectionsFindMissingOwner',
        });
        const cv = await suite.seedCv({ user });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .get(`/api/v1/cvs/${cv.id}/sections/${randomUUID()}`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .expect(404);

        expect(response.body.code).toBe('Section.NotFound');
    });

    it('should update section content when owner sends patch payload', async () => {
        const user = await suite.seedUser({
            email: 'sections-update-owner@example.com',
            userName: 'sectionsUpdateOwner',
        });
        const cv = await suite.seedCv({ user });
        const section = await suite.seedSection({
            cv,
            orderIndex: 0,
            type: SectionType.PERSONAL_INFO,
            content: { fullName: 'Old Name' },
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .patch(`/api/v1/cvs/${cv.id}/sections/${section.id}`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({ content: { fullName: 'New Name' } })
            .expect(200);

        expect(response.body.content).toEqual({ fullName: 'New Name' });

        const saved = await suite.sectionsRepository.findOneBy({ id: section.id });
        expect(saved?.content).toEqual({ fullName: 'New Name' });
    });

    it('should delete section and reindex remaining sections when owner deletes middle section', async () => {
        const user = await suite.seedUser({
            email: 'sections-delete-owner@example.com',
            userName: 'sectionsDeleteOwner',
        });
        const cv = await suite.seedCv({ user });

        const first = await suite.seedSection({
            cv,
            orderIndex: 0,
            type: SectionType.PERSONAL_INFO,
            content: { fullName: 'First' },
        });
        const middle = await suite.seedSection({
            cv,
            orderIndex: 1,
            type: SectionType.EXPERIENCE,
            content: { company: 'Middle' },
        });
        const last = await suite.seedSection({
            cv,
            orderIndex: 2,
            type: SectionType.EDUCATION,
            content: { school: 'Last' },
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        await suite
            .api()
            .delete(`/api/v1/cvs/${cv.id}/sections/${middle.id}`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .expect(204);

        const remaining = await suite.sectionsRepository.find({
            where: { cvId: cv.id },
            order: { orderIndex: 'ASC' },
        });

        expect(remaining.map((section) => section.id)).toEqual([first.id, last.id]);
        expect(remaining.map((section) => section.orderIndex)).toEqual([0, 1]);
    });

    it('should swap order indexes when move endpoint is called up', async () => {
        const user = await suite.seedUser({
            email: 'sections-move-owner@example.com',
            userName: 'sectionsMoveOwner',
        });
        const cv = await suite.seedCv({ user });

        const first = await suite.seedSection({
            cv,
            orderIndex: 0,
            type: SectionType.PERSONAL_INFO,
            content: { fullName: 'First' },
        });
        const second = await suite.seedSection({
            cv,
            orderIndex: 1,
            type: SectionType.EXPERIENCE,
            content: { company: 'Second' },
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .post(`/api/v1/cvs/${cv.id}/sections/${second.id}/move`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({ direction: 'up' })
            .expect(200);

        expect(response.body).toHaveLength(2);

        const savedFirst = await suite.sectionsRepository.findOneBy({ id: first.id });
        const savedSecond = await suite.sectionsRepository.findOneBy({ id: second.id });

        expect(savedFirst?.orderIndex).toBe(1);
        expect(savedSecond?.orderIndex).toBe(0);
    });

    it('should return bad request when moving first section up', async () => {
        const user = await suite.seedUser({
            email: 'sections-move-first-owner@example.com',
            userName: 'sectionsMoveFirstOwner',
        });
        const cv = await suite.seedCv({ user });

        const first = await suite.seedSection({
            cv,
            orderIndex: 0,
            type: SectionType.PERSONAL_INFO,
            content: { fullName: 'First' },
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .post(`/api/v1/cvs/${cv.id}/sections/${first.id}/move`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({ direction: 'up' })
            .expect(400);

        expect(response.body.code).toBe('Section.CannotMoveFirst');
    });

    it('should reject section access when cv belongs to another user', async () => {
        const owner = await suite.seedUser({
            email: 'sections-owner-idor@example.com',
            userName: 'sectionsOwnerIdor',
        });
        const attacker = await suite.seedUser({
            email: 'sections-attacker-idor@example.com',
            userName: 'sectionsAttackerIdor',
        });

        const cv = await suite.seedCv({ user: owner });

        const attackerLogin = await suite.loginHandler.handle(
            { email: attacker.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .get(`/api/v1/cvs/${cv.id}/sections`)
            .set('Authorization', suite.buildBearerToken(attackerLogin.token))
            .expect(403);

        expect(response.body.code).toBe('Cv.NotOwnedByUser');
    });

    it('should return unauthorized when sections endpoint is called without token', async () => {
        const user = await suite.seedUser({
            email: 'sections-no-auth-owner@example.com',
            userName: 'sectionsNoAuthOwner',
        });
        const cv = await suite.seedCv({ user });

        await suite.api().get(`/api/v1/cvs/${cv.id}/sections`).expect(401);
    });
});
