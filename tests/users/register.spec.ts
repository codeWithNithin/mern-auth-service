import request from 'supertest'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { isJwtValid } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'

describe('POST /auth/register . only', () => {
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

    describe('given all fields', () => {
        it('should return 201 status code', async () => {
            // AAA
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            console.log('response in 201', response.body)

            // Assert
            expect(response.status).toBe(201)
        })

        it('should return a valid json response', async () => {
            // AAA

            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.header['content-type']).toEqual(
                expect.stringContaining('json'),
            )
        })

        it('should persist the user in the database', async () => {
            // AAA

            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepo = connection.getRepository(User)
            const users = await userRepo.find()
            expect(users).toHaveLength(1)
        })

        it('should have the user id in the response', async () => {
            // AAA

            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty('id')
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            )
        })

        it('should assign a customer role', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('should store hashed password in database', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find({ select: ['password'] })

            // check if the user entered password is not same as password stored in DB
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('should return 400 if email is already present', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act

            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })

        it('should return accessToken and refreshToken inside a cookie', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            interface Headers {
                'set-cookie': string[]
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

        it('should persist refresh token in database', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // assert
            const refreshTokenRepo = connection.getRepository(RefreshToken)
            const refreshTokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()

            expect(refreshTokens).toHaveLength(1)
        })
    })
    describe('fields are missing', () => {
        it('should return status code 400 if email field is empty', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: '',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('it should return status code 400 if firstName is missing', async () => {
            // ARRANGE
            const userData = {
                firstName: '',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }
            // ACT
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(400)

            // Make sure that when bad request err is thrown, no user data should be created in database
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('it should return status code 400 if lastName is missing', async () => {
            // ARRANGE
            const userData = {
                firstName: 'Nithin',
                lastName: '',
                email: 'something@something.com',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }
            // ACT
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(400)

            // Make sure that when bad request err is thrown, no user data should be created in database
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('it should return status code 400 if password is missing', async () => {
            // ARRANGE
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: '',
                role: Roles.CUSTOMER,
            }

            // ACT
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // ASSERT
            expect(response.statusCode).toBe(400)

            // Make sure that when bad request err is thrown, no user data should be created in database
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })
    })

    describe('all fields are not in format', () => {
        it('should trim the email field', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: ' something@something.com ',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // act
            await request(app).post('/auth/register').send(userData)

            // assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0].email).toBe('something@something.com')
        })

        it('should return 400 status code if email is not a valid email', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'nithin',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if password length is less than 8 charecters', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: 'something@something.com',
                password: 'secret',
                role: Roles.CUSTOMER,
            }

            // act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            expect(response.statusCode).toBe(400)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return array of messages if email is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Nithin',
                lastName: 'V Kumar',
                email: '',
                password: 'secret-password',
                role: Roles.CUSTOMER,
            }

            // act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(
                Array.isArray((response.body as Record<string, string>).errors),
            ).toBe(true)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
    })
})
