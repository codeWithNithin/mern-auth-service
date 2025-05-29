import { NextFunction, Response } from 'express'
import { CreateUserRequest } from '../types'
import { UserService } from '../services/user.services'
import { validationResult } from 'express-validator'
import { Logger } from 'winston'

export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { firstName, lastName, email, password, tenantId, role } =
            req.body

        this.logger.debug('New request to register a user', {
            firstName,
            lastName,
            email,
            password: '***',
            role,
        })

        try {
            // create a user service, which will be responsible for creating a user
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role,
                tenantId,
            })

            this.logger.info('user has been created', { id: user.id })
            res.status(200).json({
                id: user.id,
            })
        } catch (error) {
            next(error)
            return
        }
    }
}
