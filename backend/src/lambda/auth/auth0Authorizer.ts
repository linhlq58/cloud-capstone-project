import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const cert = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJJwUrlM0U/nyYMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1mY2N6emUyMHo1azBsdmRxLnVzLmF1dGgwLmNvbTAeFw0yMzA5MDIw
MzExMDJaFw0zNzA1MTEwMzExMDJaMCwxKjAoBgNVBAMTIWRldi1mY2N6emUyMHo1
azBsdmRxLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBALVhc0zPAUEs7+uWlN0AlIzJXgRgUrpXdgy2YmDnnZ2SAelYB9+GPGiTSsJU
vX1gmXVja3HGJSI76HDHCoGWLCwnSV3z2P6FLSL05rjIHtiXEiPXM4dp6C4cu5OQ
420SZWgGiCQOTbWAcZv04pbl2OQm2rduWmxiHHqunZUcnqf4BSDXJCWkPyOUOLl3
I1u6SxWqn3rr2t6vJB8EogUUp2vVvgP0tjHFfh097gmblhBtkFKcCcavfsS8v8oT
BMGyaxqnVk3uRFLa3BiFA/MLP1uxNxIwDZr6KoJL8pt5OGiYI4VnB1+jJhnC6ps/
ljevWgAEjb8VimC9hZXVibH0n/sCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUPBf7krZOi9tpuk7ubMW65uDDXEEwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQAhP7TDUosVgeSTqqn5OnWd/hz/qtwPrDaLrsuYsHdT
is+F2aZ9SDJFiDFko0x6XnNWC0fKgXGxzz4UaUNAba84ywU/AvRn5vM+/N93FJX9
OfOk9Xvy0vLr+A3pk7Avi58An6lf/QECOWc2Y+4N0jqxzf+31ZN/M1+qLJvE8Pi3
2Yy/rL8Y6QJJwcG2VRKq70LQ271A3dqP6bhAdmaJLtHF7IDbDBElMESyjJCuTUeW
20l8Ci/Z2yf9NYo6NhCNBSth4/p1HZgkrDAN3r0hVN1OUgq2KUdsY/YR7fQtZ15K
n8DlkwsP0Q67vpkkWFMcjMJsOHdc0434oCaZNlLGQzvv
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

function verifyToken(authHeader: string): JwtPayload {
  const token = getToken(authHeader)

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
