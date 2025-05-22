import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        errorMessage: 'Email is Required!!',
        notEmpty: true,
        trim: true,
    },
})
