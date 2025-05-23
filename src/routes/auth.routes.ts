import { NextFunction, Router, Request, Response } from 'express'
import { AuthController } from '../controllers/Auth.controllers'
import { UserService } from '../services/user.services'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import { logger } from '../config/logger'
import registerValidator from '../validators/register.validator'
import { RefreshToken } from '../entity/RefreshToken'
import { TokenService } from '../services/token.services'
import loginValidator from '../validators/login.validator'

const authRouter = Router()

const userRepository = AppDataSource.getRepository(User)
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)

const userService = new UserService(userRepository)
const tokenService = new TokenService(refreshTokenRepo)

const authController = new AuthController(userService, logger, tokenService)

// we are adding additional callback because of context it is choosing.

authRouter.post(
    '/register',
    registerValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await authController.register(req, res, next)
    },
)

authRouter.post(
    '/login',
    loginValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await authController.login(req, res, next)
    },
)

export default authRouter
