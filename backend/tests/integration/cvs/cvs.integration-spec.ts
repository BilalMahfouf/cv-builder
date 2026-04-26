import { randomUUID } from 'node:crypto';
import { SectionType } from '../../../src/modules/sections/entities/section-type.enum';
import { CvsIntegrationBase } from './cvs-integration-base';

jest.setTimeout(180_000);

class CvsIntegrationSuite extends CvsIntegrationBase { }

const suite = new CvsIntegrationSuite();

describe('CVs integration', () => {
    beforeAll(async () => {
        await suite.initialize();
    });

    beforeEach(async () => {
        await suite.resetDatabase();
    });

    afterAll(async () => {
        await suite.dispose();
    });

    it('should create cv when authenticated user posts a valid payload', async () => {
        const user = await suite.seedUser({
            email: 'cvs-create@example.com',
            userName: 'cvsCreate',
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .post('/api/v1/cvs')
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({ title: 'My CV' })
            .expect(201);

        expect(response.body.title).toBe('My CV');
        expect(response.body.slug).toEqual(expect.any(String));
        expect(response.body.slug).toHaveLength(10);

        const saved = await suite.cvsRepository.findOne({
            where: { userId: user.id, title: 'My CV' },
        });
        expect(saved).not.toBeNull();
    });

    it('should use default title when create payload omits title', async () => {
        const user = await suite.seedUser({
            email: 'cvs-create-default-title@example.com',
            userName: 'cvsCreateDefaultTitle',
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .post('/api/v1/cvs')
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({})
            .expect(201);

        expect(response.body.title).toBe('Untitled CV');
    });

    it('should list only authenticated user cvs when findAll endpoint is called', async () => {
        const owner = await suite.seedUser({
            email: 'cvs-list-owner@example.com',
            userName: 'cvsListOwner',
        });
        const other = await suite.seedUser({
            email: 'cvs-list-other@example.com',
            userName: 'cvsListOther',
        });

        await suite.seedCv({ user: owner, title: 'Owner CV A' });
        await suite.seedCv({ user: owner, title: 'Owner CV B' });
        await suite.seedCv({ user: other, title: 'Other CV' });

        const loginResult = await suite.loginHandler.handle(
            { email: owner.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .get('/api/v1/cvs')
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .expect(200);

        expect(response.body).toHaveLength(2);
        expect(response.body.map((cv: { title: string }) => cv.title)).toEqual(
            expect.arrayContaining(['Owner CV A', 'Owner CV B']),
        );
    });

    it('should return public cv with sorted sections when requesting by slug without auth', async () => {
        const owner = await suite.seedUser({
            email: 'cvs-public-owner@example.com',
            userName: 'cvsPublicOwner',
        });
        const cv = await suite.seedCv({ user: owner, slug: 'publicslug' });

        await suite.seedSection({
            cv,
            orderIndex: 2,
            type: SectionType.EXPERIENCE,
            content: { company: 'Acme' },
        });
        await suite.seedSection({
            cv,
            orderIndex: 0,
            type: SectionType.PERSONAL_INFO,
            content: { fullName: 'Jane Doe' },
        });

        const response = await suite.api().get('/api/v1/cvs/public/publicslug').expect(200);

        expect(response.body.slug).toBe('publicslug');
        expect(response.body.sections).toHaveLength(2);
        expect(response.body.sections.map((section: { orderIndex: number }) => section.orderIndex)).toEqual(
            [0, 2],
        );
    });

    it('should reject access when user requests cv owned by another user', async () => {
        const owner = await suite.seedUser({
            email: 'cvs-owner-idor@example.com',
            userName: 'cvsOwnerIdor',
        });
        const attacker = await suite.seedUser({
            email: 'cvs-attacker-idor@example.com',
            userName: 'cvsAttackerIdor',
        });

        const targetCv = await suite.seedCv({ user: owner, title: 'Owner Secret CV' });

        const attackerLogin = await suite.loginHandler.handle(
            { email: attacker.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .get(`/api/v1/cvs/${targetCv.id}`)
            .set('Authorization', suite.buildBearerToken(attackerLogin.token))
            .expect(403);

        expect(response.body.code).toBe('Cv.NotOwnedByUser');
    });

    it('should update title when owner sends valid patch payload', async () => {
        const user = await suite.seedUser({
            email: 'cvs-update-owner@example.com',
            userName: 'cvsUpdateOwner',
        });
        const cv = await suite.seedCv({ user, title: 'Old title' });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .patch(`/api/v1/cvs/${cv.id}`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({ title: 'New title' })
            .expect(200);

        expect(response.body.title).toBe('New title');

        const saved = await suite.cvsRepository.findOneBy({ id: cv.id });
        expect(saved?.title).toBe('New title');
    });

    it('should delete cv and cascade sections when owner deletes an existing cv', async () => {
        const user = await suite.seedUser({
            email: 'cvs-delete-owner@example.com',
            userName: 'cvsDeleteOwner',
        });
        const cv = await suite.seedCv({ user, title: 'Delete me' });

        await suite.seedSection({
            cv,
            orderIndex: 0,
            type: SectionType.PERSONAL_INFO,
            content: { fullName: 'Delete User' },
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        await suite
            .api()
            .delete(`/api/v1/cvs/${cv.id}`)
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .expect(204);

        const deletedCv = await suite.cvsRepository.findOneBy({ id: cv.id });
        const sections = await suite.sectionsRepository.find({ where: { cvId: cv.id } });

        expect(deletedCv).toBeNull();
        expect(sections).toHaveLength(0);
    });

    it('should atomically create cv with contiguous ordered sections when guest-save endpoint is called', async () => {
        const user = await suite.seedUser({
            email: 'cvs-guest-save@example.com',
            userName: 'cvsGuestSave',
        });

        const loginResult = await suite.loginHandler.handle(
            { email: user.email, password: 'Password123!' },
            suite.createResponseMock() as never,
        );

        const response = await suite
            .api()
            .post('/api/v1/cvs/guest-save')
            .set('Authorization', suite.buildBearerToken(loginResult.token))
            .send({
                title: 'Guest Imported CV',
                sections: [
                    {
                        type: SectionType.EXPERIENCE,
                        orderIndex: 8,
                        content: { company: 'Acme' },
                    },
                    {
                        type: SectionType.PERSONAL_INFO,
                        orderIndex: 3,
                        content: { fullName: 'Guest User' },
                    },
                ],
            })
            .expect(201);

        expect(response.body.title).toBe('Guest Imported CV');
        expect(response.body.sections).toHaveLength(2);
        expect(response.body.sections.map((section: { orderIndex: number }) => section.orderIndex)).toEqual(
            [0, 1],
        );

        const stored = await suite.sectionsRepository.find({
            where: { cvId: response.body.id },
            order: { orderIndex: 'ASC' },
        });
        expect(stored.map((section) => section.orderIndex)).toEqual([0, 1]);
    });

    it('should return unauthorized when create endpoint is called without token', async () => {
        await suite.api().post('/api/v1/cvs').send({ title: 'No Auth' }).expect(401);
    });

    it('should return not found when public slug endpoint is requested for missing slug', async () => {
        const response = await suite
            .api()
            .get(`/api/v1/cvs/public/${randomUUID().replace(/-/g, '').slice(0, 10)}`)
            .expect(404);

        expect(response.body.code).toBe('Cv.NotFound');
    });
});
