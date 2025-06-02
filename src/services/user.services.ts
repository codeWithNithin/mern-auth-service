import { Repository } from 'typeorm'
import bcrypt from 'bcrypt'
import { limitedUser, UserData } from '../types'
import { User } from '../entity/User'
import createHttpError from 'http-errors'

export class UserService {
    constructor(private readonly userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
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
                role,
                tenantId: tenantId ? { id: tenantId } : undefined,
            })
        } catch (error) {
            const err = createHttpError(
                500,
                'failed to store the data in database',
            )
            throw err
        }
    }

    async findEmail(email: string) {
        try {
            return await this.userRepository.findOne({
                where: {
                    email,
                },
                select: ['id', 'firstName', 'lastName', 'password', 'role'],
            })
        } catch (err) {
            const error = createHttpError(
                500,
                'failed to fetch email from database',
            )
            throw error
        }
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: {
                id,
            },
        })
    }

    async find() {
        return await this.userRepository.find()
    }

    async update(id: number, userData: limitedUser) {
        return await this.userRepository.update(id, userData)
    }

    async delete(id: number) {
        return await this.userRepository.delete(id)
    }
}
