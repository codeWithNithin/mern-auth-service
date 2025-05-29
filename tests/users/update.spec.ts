import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { JWKSMock, createJWKSMock } from 'mock-jwks'
import { Roles } from '../../src/constants'
import { createTenant } from '../utils'
import { User } from '../../src/entity/User'

describe('PATCH /users/:id', () => {
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
            const userData = {
                firstName: 'Nithin 1',
                lastName: 'V Kumar',
                role: Roles.MANAGER,
            }

            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userRepo = connection.getRepository(User)
            const user = await userRepo.save({
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            })

            const id = user.id

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // ACT
            const response = await request(app)
                .patch(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(200)
        })

        it('should update a user in database', async () => {
            const userData = {
                firstName: 'Nithin 1',
                lastName: 'V Kumar',
                role: Roles.MANAGER,
            }

            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userRepo = connection.getRepository(User)
            const user = await userRepo.save({
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

            const id = user.id

            // ACT
            const response = await request(app)
                .patch(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(200)
            expect((response.body as Record<string, string>).id).toBe(1)
        })

        it('should return 400 if id is invalid', async () => {
            // ARRANGE
            const userData = {
                firstName: 'Nithin 1',
                lastName: 'V Kumar',
                role: Roles.MANAGER,
            }

            const tenantRepo = connection.getRepository(Tenant)
            const tenant = await createTenant(tenantRepo)

            const userRepo = connection.getRepository(User)
            await userRepo.save({
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

            const id = '3'

            const response = await request(app)
                .patch(`/users/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(400)
        })

        it('should return 401 status code if token is invalid', async () => {
            const userData = {
                firstName: 'Nithin 1',
                lastName: 'V Kumar',
                role: Roles.MANAGER,
            }

            const id = '1'

            const response = await request(app)
                .patch(`/users/${id}`)
                .send(userData)

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

            const userData = {
                firstName: 'Nithin 1',
                lastName: 'V Kumar',
                role: Roles.MANAGER,
            }

            const id = '1'

            const response = await request(app)
                .patch(`/users/${id}`)
                .set('Cookie', [`accessToken=${managerToken}`])
                .send(userData)

            expect(response.statusCode).toBe(403)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()
            expect(tenants).toHaveLength(0)
        })
    })
})
