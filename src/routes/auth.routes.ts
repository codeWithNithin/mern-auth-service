import { NextFunction, Router, Request, Response } from 'express'
import { AuthController } from '../controllers/Auth.controllers'
import { UserService } from '../services/user.services'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import { logger } from '../config/logger'
import registerValidator from '../validators/register.validator'

const authRouter = Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const authController = new AuthController(userService, logger)

// we are adding additional callback because of context it is choosing.

authRouter.post(
    '/register',
    registerValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await authController.register(req, res, next)
    },
)

export default authRouter
