import { createJWKSMock, JWKSMock } from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import app from '../../src/app'
import request from 'supertest'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { createTenant } from '../utils'
import { Tenant } from '../../src/entity/Tenant'

describe('POST /users', () => {
    let connection: DataSource
    let jwks: JWKSMock

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:8100')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // Database truncate
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('All fields given', () => {
        it('should return 200 status code', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            expect(response.statusCode).toBe(200)
        })

        it('should persist user in database', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                tenantId: tenant.id,
                role: Roles.MANAGER,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(1)
            expect(users[0].email).toBe(userData.email)
        })

        it('should create a manager user', async () => {
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                tenantId: 1,
                role: Roles.MANAGER,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(1)
            expect(users[0].role).toBe(Roles.MANAGER)
        })
    })

    describe('fields are missing', () => {
        it('should return 400 if firstName field is missing', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: '',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })
        it('should return 400 if lastName field is missing', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: 'Nithin',
                lastName: '',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })
        it('should return 400 if password field is missing', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: '',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })
        it('should return 400 if password field is less than 8 chars', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })
        it('should return 400 if role field is missing', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: '',
                tenantId: tenant.id,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })
        it('should return 400 if email field is missing', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userData = {
                firstName: 'Nithin',
                lastName: '',
                email: '',
                password: 'secret-password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${token};`])
                .send(userData)

            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })
    })
})
