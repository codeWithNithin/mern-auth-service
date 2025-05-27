import { CookieOptions, NextFunction, Response } from 'express'
import { AuthRequest, RegisterUserRequest } from '../types'
import { UserService } from '../services/user.services'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/token.services'
import createHttpError from 'http-errors'
import { CredentialService } from '../services/credential.services'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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

            const isPasswordCorrect =
                await this.credentialService.comparePassword(
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

            this.setCookie(res, 'accessToken', accessToken)
            this.setCookie(res, 'refreshToken', refreshToken)

            this.logger.info('user has been loggedIn', { id: user.id })

            res.status(200).json({
                id: user.id,
            })
        } catch (error) {
            next(error)
            return
        }
    }

    async self(req: AuthRequest, res: Response, next: NextFunction) {
        const user = await this.userService.findById(Number(req.auth.sub))
        res.status(200).json({ ...user, password: undefined })
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const payload: JwtPayload = {
                sub: String(req.auth.sub),
                role: req.auth.role,
            }

            // generate access token
            const accessToken = this.tokenService.generateAccessToken(payload)

            const user = await this.userService.findById(Number(req.auth.sub))

            if (!user) {
                const err = createHttpError(401, 'invalid token')
                next(err)
                return
            }

            // save refresh token in DB
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            // delete the previous refresh token, which was saved with refreshToken id
            await this.tokenService.deleteRefreshToken(Number(req.auth.id))

            // generate refresh token by passing the refresh token id
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: newRefreshToken.id,
            })

            this.setCookie(res, 'accessToken', accessToken)
            this.setCookie(res, 'refreshToken', refreshToken)

            this.logger.info('Access token has been created', { id: user.id })

            res.status(200).json({
                id: user.id,
            })
        } catch (err) {
            const error = createHttpError(
                500,
                'Error while updating refresh token',
            )
            next(error)
            return
        }
    }

    setCookie(res: Response, label: string, token: string) {
        const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 60 * 1
        const REFRESH_TOKEN_MAX_AGE = 1000 * 60 * 60 * 24 * 365

        const cookieOptions: CookieOptions = {
            httpOnly: true,
            sameSite: 'strict',
            maxAge:
                label === 'accessToken'
                    ? ACCESS_TOKEN_MAX_AGE
                    : REFRESH_TOKEN_MAX_AGE,
            domain: 'localhost',
        }
        return res.cookie(label, token, cookieOptions)
    }
}
