import fs from 'fs'
import { NextFunction, Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/user.services'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload, sign } from 'jsonwebtoken'
import { Config } from '../config'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req)

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { firstName, lastName, email, password } = req.body

        this.logger.debug('New request to register a user', {
            firstName,
            lastName,
            email,
            password: '***',
        })

        try {
            // create a user service, which will be responsible for creating a user
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })

            this.logger.info('user has been registered', { id: user.id })

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const privateKey = fs.readFileSync('./certs/private.pem')

            const accessToken = sign(payload, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h',
                issuer: 'auth-service',
            })

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: 'auth-service',
            })

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 2,
                domain: 'localhost',
            })

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365,
                domain: 'localhost',
            })

            res.status(201).json({
                id: user.id,
            })
        } catch (error) {
            next(error)
            return
        }
    }
}
