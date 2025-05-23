import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../entity/User'
import { Config } from '.'
import { RefreshToken } from '../entity/RefreshToken'

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: Config.DB_HOST,
    port: Number(Config.DB_PORT),
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    // dont use synchronize property in production
    // because, if any of the entity changes, it will update the database directly.
    synchronize: true,
    logging: false,
    entities: [User, RefreshToken],
    migrations: [],
    subscribers: [],
})
