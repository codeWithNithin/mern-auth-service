import { NextFunction, Response } from 'express'
import { TenantService } from '../services/Tenant.services'
import {
    AuthRequest,
    iTenantIdRequest,
    tenantCreateRequest,
    updateTenantRequest,
} from '../types'
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

    async findByIdAndUpdate(
        req: updateTenantRequest,
        res: Response,
        next: NextFunction,
    ) {
        if (isNaN(Number(req.params.id))) {
            const err = createHttpError(400, 'Invalid url param')
            next(err)
        }

        const tenantExists = await this.tenantService.findbyId(
            Number(req.params.id),
        )

        if (!tenantExists) {
            const err = createHttpError(400, 'Invalid tenant id')
            next(err)
        }

        try {
            const updatedTenant = await this.tenantService.update(
                Number(req.params.id),
                req.body,
            )
            this.logger.info('found tenant list in database', { updatedTenant })
            res.status(200).json({ id: Number(req.params.id) })
        } catch (err) {
            next(err)
        }
    }

    async findByIdAndDelete(
        req: updateTenantRequest,
        res: Response,
        next: NextFunction,
    ) {
        if (isNaN(Number(req.params.id))) {
            const err = createHttpError(400, 'Invalid url param')
            next(err)
        }

        const tenantExists = await this.tenantService.findbyId(
            Number(req.params.id),
        )

        if (!tenantExists) {
            const err = createHttpError(400, 'Invalid tenant id')
            next(err)
        }

        const result = validationResult(req)

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        try {
            const updatedTenant = await this.tenantService.delete(
                Number(req.params.id),
            )
            this.logger.info('found tenant list in database', { updatedTenant })
            res.status(200).json({ id: Number(req.params.id) })
        } catch (err) {
            next(err)
        }
    }
}
