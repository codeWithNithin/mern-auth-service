import 'reflect-metadata'
import express, { NextFunction, Request, Response } from 'express'
import { HttpError } from 'http-errors'
import { logger } from './config/logger'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import authRouter from './routes/auth.routes'
import tenantRouter from './routes/tenant.routes'
import userRouter from './routes/user.routes'
import { Config } from './config'

const app = express()

const ALLOWED_DOMAINS = [Config.ADMIN_UI]

app.use(
    cors({
        origin: ALLOWED_DOMAINS as string[],
        credentials: true,
    }),
)
app.use(express.static('public', { dotfiles: 'allow' }))
app.use(cookieParser())
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'hello' })
})

app.use('/auth', authRouter)
app.use('/tenants', tenantRouter)
app.use('/users', userRouter)

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || err.status || 500

    res.status(statusCode).json({
        errors: [
            {
                message: err.message,
                type: err.name,
                path: '',
                location: '',
            },
        ],
    })
})

export default app
