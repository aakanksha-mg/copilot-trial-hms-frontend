import { TOKEN_KEY } from './services/constant'
import { authService } from './services/authService'
import {
  ILoginRequest,
  ILoginResponseBody,
} from '@/models/authentication'
import type { ApiResponse } from '@/models/api'
import { storage } from '@/utils/storage'
import { authStore } from '@/store/authStore'

let _token: string | null = null

export const auth = {
  getToken(): string | null {
    //return 'mytoken';
    if (typeof window === 'undefined') return null // SSR guard
    if (_token) return _token
    _token = storage.get(TOKEN_KEY)

    return _token
  },

  /** Update the in-memory token cache (called after token refresh). */
  setToken(token: string | null): void {
    _token = token
  },

  isAuthenticated(): boolean {
    //return true;
    const token = this.getToken()
    if (!token) return false

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000
      if (payload.exp && payload.exp < now) {
        this.logout()
        return false
      }
      return true
    } catch {
      this.logout()
      return false
    }
  },
  async login(data: ILoginRequest): Promise<ApiResponse<ILoginResponseBody>> {
    const response = await authService.login(data)
    const loginResponse = response.responseBody.loginResponse
    if (loginResponse?.mfaRequired) {
      return response
    }
    if (loginResponse?.token) {
      _token = loginResponse.token
      storage.set(TOKEN_KEY, loginResponse.token)
      authStore.setState({
        token: loginResponse.token,
        user: loginResponse as any,
      })
    }
    return response
  },
  async generateOtp(userId: number) {
    return await authService.generateOtp(userId)
  },
  async verifyOtp(userId: number, submittedOtp: string): Promise<ApiResponse<ILoginResponseBody>> {
    const response = await authService.verifyOtp(userId, submittedOtp)
    const loginResponse = response.responseBody.loginResponse
    if (loginResponse?.token) {
      _token = loginResponse.token
      storage.set(TOKEN_KEY, loginResponse.token)
      authStore.setState({
        token: loginResponse.token,
        user: loginResponse as any,
      })
    }
    return response
  },
  logout(): void {
    _token = null
    if (typeof window !== 'undefined') {
      storage.remove(TOKEN_KEY)
      authStore.setState({ token: null, user: null })
      window.location.href = '/login'
    }
  },
}
