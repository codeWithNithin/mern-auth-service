import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import app from '../../src/app'
import request from 'supertest'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { RefreshToken } from '../../src/entity/RefreshToken'
import { Config } from '../../src/config'

describe('POST /auth/refresh', () => {
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
        it('should return 200 status code', async () => {
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

            const refreshTokenRepo = connection.getRepository(RefreshToken)
            const refreshToken = await refreshTokenRepo.save({
                user,
                expiresIn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            const token = jwt.sign(
                {
                    sub: String(user.id),
                    role: Roles.CUSTOMER,
                    id: refreshToken.id,
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: 'HS256',
                    expiresIn: '1y',
                    issuer: 'auth-service',
                },
            )

            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', [`refreshToken=${token}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it('should send 401 if refresh token is not there', async () => {
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
            const response = await request(app).post('/auth/refresh').send()

            expect(response.statusCode).toBe(401)
        })
    })
})
