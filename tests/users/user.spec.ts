import bcrypt from 'bcryptjs'
import { createJWKSMock, JWKSMock } from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import app from '../../src/app'
import request from 'supertest'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'

describe('GET /auth/self', () => {
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
            // create a mock token
            const token = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${token};`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it('should return user data', async () => {
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // Register user
            const userRepo = connection.getRepository(User)

            const user = await userRepo.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // create a mock token
            const token = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            // set cookie to response
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${token};`])
                .send()

            // check if registered user is same as in the response.
            expect((response.body as Record<string, string>).id).toBe(user.id)
        })

        it('should not return password field', async () => {
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // Register user
            const userRepo = connection.getRepository(User)

            const user = await userRepo.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // create a mock token
            const token = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            // set cookie to response
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${token};`])
                .send()

            expect(response.body).not.toHaveProperty('password')
        })

        it('should return 401 status code if token is not present', async () => {
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // Register user
            const userRepo = connection.getRepository(User)

            await userRepo.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // set cookie to response
            const response = await request(app).get('/auth/self').send()

            expect(response.statusCode).toBe(401)
        })
    })
})
