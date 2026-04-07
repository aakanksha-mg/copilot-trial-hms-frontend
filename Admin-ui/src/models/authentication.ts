import type { IAgent } from "./agent"

export interface ILoginRequest {
  username: string
  password: string
}
export interface IHRMChunks{
  HRMChunks:string,
  isEncryptionEnabled: boolean
}


export interface ILoginResponseBody {
  loginResponse: {
  mfaRequired?: boolean
  token?: string
  expiration?: string
  userId?: number
  username?: string
  role?: string | null
} | null
generateOtpResponse?: {
  success: boolean
  expiryTime: string
  expirySeconds: number
  emailMasked?: string
  } | null
  hmsDashboard: any
  agents: Array<IAgent>
}
