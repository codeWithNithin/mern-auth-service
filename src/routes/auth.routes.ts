import { Router } from 'express'
import { AuthController } from '../controllers/Auth.controllers'

const authRouter = Router()

const authController = new AuthController()

// we are adding additional callback because of context it is choosing.

authRouter.post('/register', (req, res) => authController.register(req, res))

export default authRouter
