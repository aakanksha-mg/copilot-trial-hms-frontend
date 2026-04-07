// src/services/authService.ts
import { callApi } from './apiService'
import { APIRoutes } from './constant'
import type {
  IHRMChunks,
  ILoginRequest,
  ILoginResponseBody,
} from '@/models/authentication'
import type { ApiResponse } from '@/models/api'

export const authService = {
  login: (data: ILoginRequest) =>
    callApi<ApiResponse<ILoginResponseBody>>(APIRoutes.LOGIN, [data]),

  verifyOtp: (userId: number, submittedOtp: string) =>
    callApi<ApiResponse<ILoginResponseBody>>(APIRoutes.VERIFYOTP, [
      { userId, submittedOtp },
    ]),

  generateOtp: (userId: number) =>
    callApi<ApiResponse<ILoginResponseBody>>(APIRoutes.GENERATEOTP, [
      { userId },
    ]),
}
