import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { JWKSMock, createJWKSMock } from 'mock-jwks'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { createTenant } from '../utils'

describe('GET /users', () => {
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

    describe('given all fields', () => {
        it('should return  200 status code', async () => {
            // ARRANGE

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // ACT
            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${token}`])
                .send()

            // ASSERT
            expect(response.statusCode).toBe(200)
        })

        it('should return list of users from database', async () => {
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${token}`])
                .send()

            expect(
                (response.body as Record<string, string>).users,
            ).toBeInstanceOf(Array)
        })

        it('should return 40 status code if token is invalid', async () => {
            const response = await request(app).get('/tenants').send()

            expect(response.statusCode).toBe(401)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()
            expect(tenants).toHaveLength(0)
        })

        it('should return 403 status code if token is invalid', async () => {
            const managerToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .get('/tenants')
                .set('Cookie', [`accessToken=${managerToken};`])
                .send()

            expect(response.statusCode).toBe(403)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()
            expect(tenants).toHaveLength(0)
        })
    })
})

describe('GET /users/:id', () => {
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

    describe('given all fields', () => {
        it('should return 200 status code', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const tenantsData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                tenantId: tenant.id,
                role: Roles.MANAGER,
            }

            const userRepo = connection.getRepository(User)
            const mewUser = await userRepo.save({
                ...tenantsData,
            })

            // ARRANGE
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const id = mewUser.id

            // ACT
            const response = await request(app)
                .get(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send()

            // ASSERT
            expect(response.statusCode).toBe(200)
        })

        it('should return 404 if id is invalid', async () => {
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const id = 3

            // ACT
            const response = await request(app)
                .get(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send()

            // ASSERT
            expect(response.statusCode).toBe(400)
        })

        it('should return 401 status code if token is invalid', async () => {
            const id = '1'

            const response = await request(app).get(`/users/${id}`).send()

            expect(response.statusCode).toBe(401)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()
            expect(tenants).toHaveLength(0)
        })

        it('should return 403 status code if token is invalid', async () => {
            const managerToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            })

            const id = '1'

            const response = await request(app)
                .get(`/users/${id}`)
                .set('Cookie', [`accessToken=${managerToken};`])
                .send()

            expect(response.statusCode).toBe(403)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()
            expect(tenants).toHaveLength(0)
        })
    })
})
