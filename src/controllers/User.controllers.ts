import { NextFunction, Response, Request } from 'express'
import { CreateUserRequest } from '../types'
import { UserService } from '../services/user.services'
import { validationResult } from 'express-validator'
import { Logger } from 'winston'
import createHttpError from 'http-errors'

export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: Logger,
    ) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { firstName, lastName, email, password, tenantId, role } =
            req.body

        const userExists = await this.userService.findEmail(email)

        if (userExists) {
            const err = createHttpError(400, 'User already exists')
            next(err)
            return
        }

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

    async find(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.userService.find()
            res.json({ users })
        } catch (err) {
            next(err)
        }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.findById(Number(req.params.id))

            if (!user) {
                const err = createHttpError(400, 'Invalid user id')
                next(err)
                return
            }

            res.status(200).json({ user })
        } catch (err) {
            next(err)
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        // EMail field cannot be updated
        // admin cannot change other user's password
        try {
            const user = await this.userService.findById(Number(req.params.id))

            if (!user) {
                const err = createHttpError(400, 'Invalid user id')
                next(err)
                return
            }

            const { firstName, lastName, role } = req.body

            await this.userService.update(Number(req.params.id), {
                firstName,
                lastName,
                role,
            })

            res.status(200).json({ id: Number(req.params.id) })
        } catch (err) {
            next(err)
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        const id = Number(req.params.id)

        const user = await this.userService.findById(id)

        if (!user) {
            const err = createHttpError(400, 'Invalid user id')
            next(err)
            return
        }

        try {
            await this.userService.delete(id)
            res.status(200).json({ id })
        } catch (err) {
            next(err)
        }
    }
}
