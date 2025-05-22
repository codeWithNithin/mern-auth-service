import { Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/user.services'
import { logger } from '../config/logger'

export class AuthController {
    constructor(private userService: UserService) {}

    async register(req: RegisterUserRequest, res: Response) {
        const { firstName, lastName, email, password } = req.body
        // create a user service, which will be responsible for creating a user
        const user = await this.userService.create({
            firstName,
            lastName,
            email,
            password,
        })

        logger.info('user created', { id: user.id })

        res.status(201).json({
            id: user.id,
        })
    }
}
