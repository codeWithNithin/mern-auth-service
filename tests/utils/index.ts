import { Repository } from 'typeorm'
import { Tenant } from '../../src/entity/Tenant'

export const isJwtValid = (token: string | null) => {
    if (token === null) return false
    const parts = token.split('.')

    if (parts.length != 3) return false

    try {
        parts.forEach((part) => {
            Buffer.from(part, 'base64').toString('utf-8')
        })

        return true
    } catch (err) {
        return false
    }
}

export const createTenant = async (repository: Repository<Tenant>) => {
    const tenants = await repository.save({
        name: 'Test tenant name',
        address: 'Test tenant address',
    })

    return tenants
}
