import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { JWKSMock, createJWKSMock } from 'mock-jwks'
import { Roles } from '../../src/constants'

describe('POST /tenants', () => {
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
        it('should return  201 status code', async () => {
            const tenantsData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            expect(response.statusCode).toBe(201)
        })

        it('should create a tenant in database', async () => {
            const tenantsData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            const tenantRepo = connection.getRepository(Tenant)
            const tenants = await tenantRepo.find()

            expect(tenants).toHaveLength(1)
            expect(tenants[0].name).toBe(tenantsData.name)
            expect(tenants[0].address).toBe(tenantsData.address)
        })

        it('should return 401 status code if token is invalid', async () => {
            const tenantsData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const response = await request(app)
                .post('/tenants')
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

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${managerToken};`])
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
                .post('/tenants')
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if address field is missing', async () => {
            const tenantsData = {
                name: 'tenant name',
                address: '',
            }

            const token = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${token}`])
                .send(tenantsData)

            expect(response.statusCode).toBe(400)
        })
    })
})
