import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { JWKSMock, createJWKSMock } from 'mock-jwks'
import { Roles } from '../../src/constants'

describe('PATCH /tenants/:id', () => {
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
            const tenantRepo = connection.getRepository(Tenant)
            await tenantRepo.save({
                name: 'default name',
                address: 'default address',
            })

            const tenantsData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const id = '1'

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // ACT
            const response = await request(app)
                .patch(`/tenants/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            // ASSERT
            expect(response.statusCode).toBe(200)
        })

        it('should update a tenant in database', async () => {
            // ARRANGE
            const tenantsData = {
                name: 'tenant name 1',
                address: 'tenant address',
            }

            const tenantRepo = connection.getRepository(Tenant)
            await tenantRepo.save({
                name: 'default name',
                address: 'default address',
            })

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const id = '1'

            // ACT
            const response = await request(app)
                .patch(`/tenants/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            // ASSERT
            expect(response.statusCode).toBe(200)
            expect((response.body as Record<string, string>).id).toBe(1)
        })

        it('should return 404 if id is invalid', async () => {
            // ARRANGE
            const tenantsData = {
                name: 'tenant name 1',
                address: 'tenant address',
            }

            // ACT
            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const id = '3'

            const response = await request(app)
                .patch(`/tenants/${id}`)
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            // ASSERT
            expect(response.statusCode).toBe(404)
        })

        it('should return 401 status code if token is invalid', async () => {
            const tenantsData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const id = '1'

            const response = await request(app)
                .patch(`/tenants/${id}`)
                .send(tenantsData)

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

            const tenantsData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const id = '1'

            const response = await request(app)
                .patch(`/tenants/${id}`)
                .set('Cookie', [`accessToken=${managerToken}`])
                .send(tenantsData)

            expect(response.statusCode).toBe(403)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()
            expect(tenants).toHaveLength(0)
        })
    })

    describe('fields are missing', () => {
        it('should return 400  status code if name filed is missing', async () => {
            const tenantsData = {
                name: '',
                address: 'tenant address',
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch(`/tenants/1`)
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if address field is missing', async () => {
            // ARRANGE
            const tenantsData = {
                name: 'tenant name',
                address: '',
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // ACT
            const response = await request(app)
                .patch('/tenants/1')
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            // ASSERT
            expect(response.statusCode).toBe(400)
        })
    })
})
