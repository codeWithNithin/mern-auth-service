import request from 'supertest'
import { calculateDiscount } from './src/utils'
import app from './src/app'

describe.skip('app test', () => {
    it('should return discount amount', () => {
        const discount = calculateDiscount(100, 10)
        expect(discount).toBe(10)
    })

    it('should return status code 200', async () => {
        const response = await request(app).get('/')
        expect(response.statusCode).toBe(200)
    })
})
