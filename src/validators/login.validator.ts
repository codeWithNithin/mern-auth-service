import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        errorMessage: 'Email is Required!!',
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: 'Email should be a valid email',
        },
    },
    password: {
        trim: true,
        errorMessage: 'Password is missing !!!',
        notEmpty: true,
    },
})
