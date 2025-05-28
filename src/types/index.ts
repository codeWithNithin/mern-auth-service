import { Request } from 'express'

export interface UserData {
    firstName: string
    lastName: string
    email: string
    password: string
}

export interface RegisterUserRequest extends Request {
    body: UserData
}

export interface AuthRequest extends Request {
    auth: {
        sub: string
        role: string
        id?: string
    }
}

export interface AuthCookie extends Request {
    refreshToken: string
    accessToken: string
}

export interface refreshTokenPayload extends Request {
    id: string
}

export interface iTenantData {
    name: string
    address: string
}

export interface tenantCreateRequest extends Request {
    body: iTenantData
}
