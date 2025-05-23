import app from './app'
import { Config } from './config'
import { AppDataSource } from './config/data-source'
import { logger } from './config/logger'

const startServer = async () => {
    try {
        const PORT = Config.PORT
        await AppDataSource.initialize()
        logger.info('Database connection successful')
        app.listen(PORT, () => {
            logger.info('server running at PORT', { port: PORT })
        })
    } catch (err) {
        process.exit(1)
    }
}

void startServer()
