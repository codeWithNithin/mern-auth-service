import { Router } from 'express'
import { AuthController } from '../controllers/Auth.controllers'
import { UserService } from '../services/user.services'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'

const authRouter = Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const authController = new AuthController(userService)

// we are adding additional callback because of context it is choosing.

authRouter.post('/register', (req, res) => authController.register(req, res))

export default authRouter
