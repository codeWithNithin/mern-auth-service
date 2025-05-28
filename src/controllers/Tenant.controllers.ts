import { NextFunction, Response } from 'express'
import { TenantService } from '../services/Tenant.services'
import { AuthRequest, iTenantIdRequest, tenantCreateRequest } from '../types'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import createHttpError from 'http-errors'

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: tenantCreateRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { name, address } = req.body

        this.logger.info('new request to create tenant', { name, address })

        try {
            const newTenant = await this.tenantService.create({ name, address })
            this.logger.info('created tenant in database', { id: newTenant.id })
            res.status(201).json({ id: newTenant.id })
        } catch (err) {
            next(err)
        }
    }

    async find(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tenants = await this.tenantService.find()
            this.logger.info('found tenant list in database', { tenants })
            res.status(200).json({ tenants })
        } catch (err) {
            next(err)
        }
    }

    async findById(req: iTenantIdRequest, res: Response, next: NextFunction) {
        try {
            const tenant = await this.tenantService.findbyId(
                Number(req.params.id),
            )

            if (!tenant) {
                const error = createHttpError(404, 'Invalid id')
                next(error)
                return
            }

            this.logger.info('found tenant data in database', {
                id: Number(req.params.id),
            })
            res.status(200).json({ tenant })
        } catch (err) {
            next(err)
        }
    }
}
