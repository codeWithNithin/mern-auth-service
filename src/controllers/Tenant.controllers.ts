import { NextFunction, Response } from 'express'
import { TenantService } from '../services/Tenant.services'
import { tenantCreateRequest } from '../types'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'

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
}
