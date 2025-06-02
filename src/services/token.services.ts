import createHttpError from 'http-errors'
import { JwtPayload, sign } from 'jsonwebtoken'
import { Config } from '../config'
import { Repository } from 'typeorm'
import { RefreshToken } from '../entity/RefreshToken'
import { User } from '../entity/User'

export class TokenService {
    constructor(private readonly refreshTokenRepo: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload) {
        let privateKey: string

        if (!Config.PRIVATE_KEY) {
            const err = createHttpError(500, 'SECRET_KEY is not set')
            throw err
        }

        try {
            privateKey = Config.PRIVATE_KEY!

            const accessToken = sign(payload, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h',
                issuer: 'auth-service',
            })

            return accessToken
        } catch (err) {
            const error = createHttpError(500, 'Error while reading key')
            throw error
        }
    }

    generateRefreshToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: String(payload.id),
        })

        return refreshToken
    }

    async persistRefreshToken(user: User) {
        // const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)

        const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365

        const newRefreshToken = await this.refreshTokenRepo.save({
            user: user,
            expiresIn: new Date(Date.now() + MS_IN_YEAR),
        })

        return newRefreshToken
    }

    async deleteRefreshToken(id: number) {
        return await this.refreshTokenRepo.delete(id)
    }
}
