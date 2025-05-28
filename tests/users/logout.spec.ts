import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { RefreshToken } from '../../src/entity/RefreshToken'
import { Config } from '../../src/config'
import { createJWKSMock, JWKSMock } from 'mock-jwks'

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

describe('POST /auth/logout', () => {
    describe('All fields are given', () => {
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
            const newRefreshToken = await refreshTokenRepo.save({
                user,
                expiresIn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            const refreshToken = jwt.sign(
                {
                    sub: String(user.id),
                    role: Roles.CUSTOMER,
                    id: newRefreshToken.id,
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: 'HS256',
                    expiresIn: '1y',
                    issuer: 'auth-service',
                },
            )

            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            })

            const respose = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `refreshToken=${refreshToken};accessToken=${accessToken};`,
                ])
                .send()

            expect(respose.statusCode).toBe(200)
        })

        it('should return 400 if the refresh token is invalid', async () => {
            const respose = await request(app).post('/auth/logout').send()
            expect(respose.statusCode).toBe(401)
        })
    })
})
