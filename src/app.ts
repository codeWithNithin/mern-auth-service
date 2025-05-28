import 'reflect-metadata'
import express, { NextFunction, Request, Response } from 'express'
import { HttpError } from 'http-errors'
import { logger } from './config/logger'
import authRouter from './routes/auth.routes'
import cookieParser from 'cookie-parser'

const app = express()

app.use(express.static('public', { dotfiles: 'allow' }))
app.use(cookieParser())
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'hello' })
})

app.use('/auth', authRouter)

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
