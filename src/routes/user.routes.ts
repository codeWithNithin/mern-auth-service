import { NextFunction, Router, Request, Response } from 'express'
import { UserService } from '../services/user.services'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import { logger } from '../config/logger'
import registerValidator from '../validators/register.validator'
import { UserController } from '../controllers/User.controllers'
import authenticate from '../middlewares/authenticate.middleware'
import { canAccess } from '../middlewares/canAccess.middleware'
import { Roles } from '../constants'

const userRoutes = Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService, logger)

// we are adding additional callback because of context it is choosing.

userRoutes.post(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]),
    registerValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await userController.create(req, res, next)
    },
)

export default userRoutes
