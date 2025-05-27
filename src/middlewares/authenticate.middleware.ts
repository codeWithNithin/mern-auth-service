import { expressjwt } from 'express-jwt'
import jwksClient from 'jwks-rsa'
import { Config } from '../config'
import { Request } from 'express'
import { AuthCookie } from '../types'

export default expressjwt({
    secret: jwksClient.expressJwtSecret({
        jwksUri: Config.JWKS_URI!,
        cache: true, // for every request, we should not fetch the token,
        rateLimit: true, // limiting number of requests
    }),
    algorithms: ['RS256'],
    getToken(req: Request) {
        const authHeaders = req.headers.authorization
        let token = null
        if (authHeaders && authHeaders.split('')[1] != 'undefined') {
            token = authHeaders.split(' ')[1]
            if (token) return token
        }

        const { accessToken } = req.cookies as AuthCookie
        return accessToken
    },
})
