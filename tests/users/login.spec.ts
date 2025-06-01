import bcrypt from 'bcrypt'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import app from '../../src/app'
import request from 'supertest'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { isJwtValid } from '../utils'

describe('POST /auth/login', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('All fields given', () => {
        it('should return 200 status code in response', async () => {
            //  ARRANGE
            const userData = {
                email: 'something@something.com',
                password: 'secret-password',
            }

            //  ARRANGE
            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // ASSERT
            const userRepo = connection.getRepository(User)

            await userRepo.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
                firstName: 'Nithin',
                lastName: 'V Kumar',
            })

            //  ACT
            const response = await request(app)
                .post('/auth/login')
                .send(userData)

            // ASSERT
            expect(response.status).toBe(200)
        })

        it('should return access token and refresh token in cookie', async () => {
            //  ARRANGE
            const userData = {
                email: 'something@something.com',
                password: 'secret-password',
            }

            //  ARRANGE
            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // ASSERT
            const userRepo = connection.getRepository(User)

            await userRepo.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
                firstName: 'Nithin',
                lastName: 'V Kumar',
            })

            //  ACT
            const response = await request(app)
                .post('/auth/login')
                .send(userData)

            interface Headers {
                ['set-cookie']: string[]
            }

            // Assert
            let accessToken = ''
            let refreshToken = ''
            const cookies =
                (response.headers as unknown as Headers)['set-cookie'] || []
            // accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjkzOTA5Mjc2LCJleHAiOjE2OTM5MDkzMzYsImlzcyI6Im1lcm5zcGFjZSJ9.KetQMEzY36vxhO6WKwSR-P_feRU1yI-nJtp6RhCEZQTPlQlmVsNTP7mO-qfCdBr0gszxHi9Jd1mqf-hGhfiK8BRA_Zy2CH9xpPTBud_luqLMvfPiz3gYR24jPjDxfZJscdhE_AIL6Uv2fxCKvLba17X0WbefJSy4rtx3ZyLkbnnbelIqu5J5_7lz4aIkHjt-rb_sBaoQ0l8wE5KzyDNy7mGUf7cI_yR8D8VlO7x9llbhvCHF8ts6YSBRBt_e2Mjg5txtfBaDq5auCTXQ2lmnJtMb75t1nAFu8KwQPrDYmwtGZDkHUcpQhlP7R-y3H99YnrWpXbP8Zr_oO67hWnoCSw; Max-Age=43200; Domain=localhost; Path=/; Expires=Tue, 05 Sep 2023 22:21:16 GMT; HttpOnly; SameSite=Strict
            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwtValid(accessToken)).toBeTruthy()
            expect(isJwtValid(refreshToken)).toBeTruthy()
        })

        it('should return 400 if email or password is wrong', async () => {
            //  ARRANGE
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // ASSERT
            const userRepo = connection.getRepository(User)

            await userRepo.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //  ACT
            const response = await request(app).post('/auth/login').send({
                email: userData.email,
                password: 'wrongPass',
            })

            expect(response.statusCode).toBe(400)
        })
    })

    describe('Fields are missing', () => {
        it('should return 400 if email is missing', async () => {
            //  ARRANGE
            const userData = {
                email: '',
                password: 'secret-password',
            }

            //  ACT
            const response = await request(app)
                .post('/auth/login')
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })

        it('should return 400 if password is missing', async () => {
            //  ARRANGE
            const userData = {
                email: 'something@something.com',
                password: '',
            }

            //  ACT
            const response = await request(app)
                .post('/auth/login')
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(400)

            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()

            expect(users).toHaveLength(0)
        })
    })
})
