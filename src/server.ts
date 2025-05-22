import app from './app'
import { Config } from './config'
import { logger } from './config/logger'

const startServer = () => {
    try {
        const PORT = Config.PORT
        app.listen(PORT, () => {
            logger.info('server running at PORT', { port: PORT })
        })
    } catch {
        process.exit(1)
    }
}

startServer()
