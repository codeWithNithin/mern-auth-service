import { config } from 'dotenv'

config({ path: `./.env.${process.env.NODE_ENV || 'dev'}` })

const {
    NODE_ENV,
    PORT,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
    PRIVATE_KEY,
    DB_SSL,
    ADMIN_UI,
} = process.env

export const Config = {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
    PRIVATE_KEY,
    DB_SSL,
    ADMIN_UI,
}
