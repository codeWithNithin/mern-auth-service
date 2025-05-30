import { NextFunction, Router, Response, Request } from 'express'
import { TenantController } from '../controllers/Tenant.controllers'
import { TenantService } from '../services/Tenant.services'
import { AppDataSource } from '../config/data-source'
import { Tenant } from '../entity/Tenant'
import { logger } from '../config/logger'
import authenticate from '../middlewares/authenticate.middleware'
import { canAccess } from '../middlewares/canAccess.middleware'
import { Roles } from '../constants'
import tenantValidator from '../validators/tenant.validator'
import {
    AuthRequest,
    iTenantIdRequest,
    tenantCreateRequest,
    updateTenantRequest,
} from '../types'

const tenantRouter = Router()

const tenantRepository = AppDataSource.getRepository(Tenant)

const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)

tenantRouter.post(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]),
    tenantValidator,
    async (req: tenantCreateRequest, res: Response, next: NextFunction) => {
        await tenantController.create(req, res, next)
    },
)

tenantRouter.get(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.find(req as AuthRequest, res, next)
    },
)

tenantRouter.get(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.findById(req as iTenantIdRequest, res, next)
    },
)

tenantRouter.patch(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.findByIdAndUpdate(
            req as updateTenantRequest,
            res,
            next,
        )
    },
)

tenantRouter.delete(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.findByIdAndDelete(
            req as iTenantIdRequest,
            res,
            next,
        )
    },
)

export default tenantRouter
