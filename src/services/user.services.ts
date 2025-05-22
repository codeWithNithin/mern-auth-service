import { Repository } from 'typeorm'
import { UserData } from '../types'
import { User } from '../entity/User'
import createHttpError from 'http-errors'
import { Roles } from '../constants'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
                role: Roles.CUSTOMER,
            })
        } catch {
            const err = createHttpError(
                500,
                'failed to store the data in database',
            )
            throw err
        }
    }
}
