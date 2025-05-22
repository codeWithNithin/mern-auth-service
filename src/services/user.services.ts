import { Repository } from 'typeorm'
import bcrypt from 'bcrypt'
import { UserData } from '../types'
import { User } from '../entity/User'
import createHttpError from 'http-errors'
import { Roles } from '../constants'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await this.userRepository.findOne({
            where: {
                email: email,
            },
        })

        if (user) {
            const err = createHttpError(
                400,
                'user with same email id already exists!!',
            )
            throw err
        }

        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })
        } catch (error) {
            const err = createHttpError(
                500,
                'failed to store the data in database',
            )
            throw err
        }
    }
}
