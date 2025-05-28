import { checkSchema } from 'express-validator'

export default checkSchema({
    name: {
        errorMessage: 'Tenant name is required !!',
        notEmpty: true,
        trim: true,
        isLength: {
            options: { max: 100 },
            errorMessage: 'Tenant name should be at least 100 chars',
        },
    },
    address: {
        errorMessage: 'Tenant address is required !!',
        notEmpty: true,
        trim: true,
        isLength: {
            options: { max: 255 },
            errorMessage: 'Tenant address should be at least 255 chars',
        },
    },
})
