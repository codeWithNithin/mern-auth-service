import { JWKSMock, createJWKSMock } from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Tenant } from '../../src/entity/Tenant'
import request from 'supertest'
import { Roles } from '../../src/constants'
import app from '../../src/app'
import { createTenant } from '../utils'
import { User } from '../../src/entity/User'

describe('DEL /users/:id', () => {
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

            const userRepo = connection.getRepository(User)
            const newUser = await userRepo.save({
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            })

            // ACT
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const id = newUser.id

            // ACT
            const response = await request(app)
                .delete(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send()

            // ASSERT
            expect(response.statusCode).toBe(200)
        })

        it('should return id in response', async () => {
            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userRepo = connection.getRepository(User)
            const newUser = await userRepo.save({
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            })

            // ARRANGE
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const id = newUser.id

            // ACT
            const response = await request(app)
                .delete(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send()

            // ASSERT
            expect((response.body as Record<string, string>).id).toBe(id)
        })

        it('should return 400 if id is invalid', async () => {
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const id = 3

            // ACT
            const response = await request(app)
                .delete(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send()

            // ASSERT
            expect(response.statusCode).toBe(400)
        })

        it('should return 401 status code if token is invalid', async () => {
            const id = '1'

            const response = await request(app).delete(`/users/${id}`).send()

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
                .delete(`/users/${id}`)
                .set('Cookie', [`accessToken=${managerToken};`])
                .send()

            expect(response.statusCode).toBe(403)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()
            expect(tenants).toHaveLength(0)
        })
    })
})
