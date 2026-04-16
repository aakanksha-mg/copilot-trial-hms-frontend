import { useEffect, useState } from 'react'
import { BiShield } from 'react-icons/bi'
import { useNavigate } from '@tanstack/react-router'
import { useAppForm } from '@/components/form'
import LoginForm from '@/components/login/LoginForm'
import ForgotPasswordForm from '@/components/login/ForgotPasswordForm'
import OtpVerificationForm from '@/components/login/OtpVerificationForm'
import SuccessMessage from '@/components/login/SuccessMessage'
import { UserNameSchema } from '@/schema/authSchema'
import { auth } from '@/auth'
import { showToast } from '@/components/ui/sonner'
import { RoutePaths } from '@/utils/constant'

type Step = 'login' | 'forgot-email' | 'otp' | 'success'

export default function Login() {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState<Step>('login')
  const [otp, setOtp] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(0)
  const [currentUserId, setCurrentUserId] = useState<number>(0)
  const [maskedEmail, setMaskedEmail] = useState<string>('')
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [hasGeneratedOtp, setHasGeneratedOtp] = useState(false)
  // ✅ Countdown handler
  useEffect(() => {
    if (countdown <= 0) {
      setMaskedEmail('')
      setOtp('')
      return
    }

    const timerId = window.setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [countdown])


  useEffect(() => {
    setHasGeneratedOtp(false) // ✅ IMPORTANT
  }, [])

  // ✅ Call API to generate OTP
  const triggerOtpSend = async (userId: number) => {
    try {
      setIsGeneratingOtp(true)

      const response = await auth.generateOtp(userId)

      if (response.responseHeader.errorCode === 1101) {
        const payload = response.responseBody?.generateOtpResponse
        setMaskedEmail(payload?.emailMasked || '')
        setCountdown(payload?.expirySeconds || 60)
        setCurrentStep('otp')
        setOtp('')
        setHasGeneratedOtp(true) // ✅ IMPORTANT
      } else {
        showToast('error', response.responseHeader.errorMessage || 'Failed to generate OTP')
      }
    } catch (err: any) {
      showToast('error', err?.responseHeader?.errorMessage || 'Failed to generate OTP')
    }
    finally {
      setIsGeneratingOtp(false)
    }
  }

  // ✅ When MFA required
  const handleMfaRequired = async (userId: number) => {
    setCurrentUserId(userId)
    setCurrentStep('otp')
    setOtp('')
    setCountdown(0)
    setMaskedEmail('')
  }

  // ✅ Generate OTP button
  const handleGenerateOtp = async () => {
    if (countdown > 0) return
    if (currentUserId > 0) {
      await triggerOtpSend(currentUserId)
    }
  }

  const forgetform = useAppForm({
    defaultValues: { username: '' },
    validators: { onChange: UserNameSchema },
    onSubmit: async ({ value }) => {
      if (!value.username) return
      setCurrentStep('otp')
      setCountdown(60)
    },
  })

  const handleForgotPassword = () => {
    setCurrentStep('forgot-email')
  }

  // ✅ Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length === 6 && currentUserId > 0) {
      try {
        setIsVerifyingOtp(true)
        const response = await auth.verifyOtp(currentUserId, otp)

        if (response.responseHeader.errorCode === 1101) {
          // ✅ Reset state after success
          setCountdown(0)
          setMaskedEmail('')
          setOtp('')

          navigate({ to: RoutePaths.SEARCH })
        } else {
          showToast('error', response.responseHeader.errorMessage || 'Invalid OTP')
        }
      } catch (err: any) {
        showToast('error', err?.responseHeader?.errorMessage || 'Invalid OTP')
      }
      finally {
        setIsVerifyingOtp(false) // ✅ stop loader
      }
    }
  }

  const handleBackToLogin = () => {
    setCurrentStep('login')
    setOtp('')
    setCountdown(0)
    setMaskedEmail('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <div className="relative z-10 w-[30rem]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">HM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Distribution Management
          </h1>
          <p className="text-gray-600 flex items-center justify-center gap-2 text-sm">
            <BiShield className="w-4 h-4 text-blue-500" />
            Administrator Portal
          </p>
        </div>

        {/* Steps */}
        {currentStep === 'login' && (
          <LoginForm
            onForgotPassword={handleForgotPassword}
            onMfaRequired={handleMfaRequired}
          />
        )}

        {currentStep === 'forgot-email' && (
          <ForgotPasswordForm
            onBack={handleBackToLogin}
            onSubmit={forgetform.handleSubmit}
          />
        )}

        {currentStep === 'otp' && (
          <OtpVerificationForm
            otp={otp}
            countdown={countdown}
            setOtp={setOtp}
            onBack={handleBackToLogin}
            onVerify={handleVerifyOTP}
            onGenerate={handleGenerateOtp}
            emailMasked={maskedEmail}
            hasGeneratedOtp={hasGeneratedOtp}
            isGeneratingOtp={isGeneratingOtp}
            isVerifyingOtp={isVerifyingOtp}
          />
        )}

        {currentStep === 'success' && (
          <SuccessMessage onBackToLogin={handleBackToLogin} />
        )}
      </div>
    </div>
  )
}