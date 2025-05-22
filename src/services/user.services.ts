import { Repository } from 'typeorm'
import { UserData } from '../types'
import { User } from '../entity/User'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        return await this.userRepository.save({
            firstName,
            lastName,
            email,
            password,
        })
    }
}
