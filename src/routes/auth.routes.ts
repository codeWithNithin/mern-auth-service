import {
    NextFunction,
    Router,
    Request,
    Response,
    RequestHandler,
} from 'express'
import { AuthController } from '../controllers/Auth.controllers'
import { UserService } from '../services/user.services'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import { logger } from '../config/logger'
import registerValidator from '../validators/register.validator'
import { RefreshToken } from '../entity/RefreshToken'
import { TokenService } from '../services/token.services'
import loginValidator from '../validators/login.validator'
import { CredentialService } from '../services/credential.services'
import authenticate from '../middlewares/authenticate.middleware'
import { AuthRequest } from '../types'
import validateRefreshToken from '../middlewares/Validate-refreshToken.middleware'
import parseRefreshToken from '../middlewares/parse-refreshToken.middleware'

const authRouter = Router()

const userRepository = AppDataSource.getRepository(User)
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)

const userService = new UserService(userRepository)
const tokenService = new TokenService(refreshTokenRepo)
const credentialService = new CredentialService()

const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
)

// we are adding additional callback because of context it is choosing.

authRouter.post('/register', registerValidator, (async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    await authController.register(req, res, next)
}) as RequestHandler)

authRouter.post(
    '/login',
    loginValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await authController.login(req, res, next)
    },
)

authRouter.get(
    '/self',
    authenticate as RequestHandler,
    async (req: Request, res: Response, next: NextFunction) => {
        await authController.self(req as AuthRequest, res, next)
    },
)

authRouter.post(
    '/refresh',
    validateRefreshToken as RequestHandler,
    async (req: Request, res: Response, next: NextFunction) => {
        await authController.refresh(req as AuthRequest, res, next)
    },
)

authRouter.post(
    '/logout',
    authenticate as RequestHandler,
    parseRefreshToken as RequestHandler,
    async (req: Request, res: Response, next: NextFunction) => {
        await authController.logout(req as AuthRequest, res, next)
    },
)

export default authRouter
