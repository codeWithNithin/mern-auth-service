import rsaPemToJwk from 'rsa-pem-to-jwk'
import fs from 'fs'

const privateKey = fs.readFileSync('./certs/private.pem', 'utf-8')

console.log('privateKey', privateKey)

const jwk = rsaPemToJwk(privateKey, { use: 'sig' }, 'public')

console.log(JSON.stringify(jwk))
