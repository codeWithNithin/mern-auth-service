import { NextFunction, Response } from 'express'
import bcrypt from 'bcrypt'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/user.services'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/token.services'
import createHttpError from 'http-errors'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
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

            // generate access token
            const accessToken = this.tokenService.generateAccessToken(payload)

            // save refresh token in DB
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            // generate refresh token by passing the refresh token id
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: newRefreshToken.id,
            })

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 1,
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

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { email, password } = req.body

        this.logger.debug('New request to login', {
            email,
            password: '***',
        })

        try {
            const user = await this.userService.findEmail(email)

            if (!user) {
                const error = createHttpError(
                    400,
                    'Email or password does not exist',
                )
                next(error)
                return
            }

            const isPasswordCorrect = await bcrypt.compare(
                password,
                user.password,
            )

            if (!isPasswordCorrect) {
                const error = createHttpError(
                    400,
                    'Email or password does not exist',
                )
                next(error)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            // generate access token
            const accessToken = this.tokenService.generateAccessToken(payload)

            // save refresh token in DB
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            // generate refresh token by passing the refresh token id
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: newRefreshToken.id,
            })

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 1,
                domain: 'localhost',
            })

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365,
                domain: 'localhost',
            })

            res.status(200).json({
                id: user.id,
            })
        } catch (error) {
            next(error)
            return
        }
    }
}
