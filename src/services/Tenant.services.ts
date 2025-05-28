import { Repository } from 'typeorm'
import { Tenant } from '../entity/Tenant'
import { iTenantData } from '../types'

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}

    async create(tenantData: iTenantData) {
        return await this.tenantRepository.save(tenantData)
    }

    async find() {
        return await this.tenantRepository.find()
    }

    async findbyId(id: number) {
        return await this.tenantRepository.findOne({
            where: {
                id,
            },
        })
    }
}
