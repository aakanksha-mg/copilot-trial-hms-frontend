import type { IAgent } from "./agent"

export interface ILoginRequest {
  username: string
  password: string
}
export interface IHRMChunks {
  HRMChunks: string,
  isEncryptionEnabled: boolean
}


export interface ILoginResponseBody {
  loginResponse: {
    token: string
    expiration: string
    userId: number
    username: string
    role: string | null
  } | null
  hmsDashboard: any
  agents: Array<IAgent>
}