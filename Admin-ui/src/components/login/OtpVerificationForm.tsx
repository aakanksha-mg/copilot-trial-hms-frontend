import React from 'react'
import { BiUserCheck } from 'react-icons/bi'
import { BsArrowLeft } from 'react-icons/bs'
import Button from '../ui/button'
import { Card, CardContent } from '../ui/card'
import OTPInput from './OTPInput'

interface OtpVerificationFormProps {
  otp: string
  countdown: number
  setOtp: (val: string) => void
  onBack: () => void
  onVerify: () => void
  onGenerate: () => void
  emailMasked?: string
  hasGeneratedOtp: boolean // ✅ NEW
  isGeneratingOtp: boolean
  isVerifyingOtp: boolean
}

const OtpVerificationForm: React.FC<OtpVerificationFormProps> = ({
  otp,
  countdown,
  setOtp,
  onBack,
  onVerify,
  onGenerate,
  emailMasked,
  hasGeneratedOtp,
  isGeneratingOtp,
  isVerifyingOtp
}) => {
  const otpActive = countdown > 0

  return (
    <Card className="animate-slide-up">
      <CardContent>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-lg mb-4 shadow-lg">
            <BiUserCheck className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Enter Verification Code
          </h2>

          {otpActive ? (
            <>
              <p className="text-gray-600 text-sm">
                We've sent a 6-digit code to your email
              </p>

              {emailMasked && (
                <p className="text-orange-600 font-medium text-sm">
                  {emailMasked}
                </p>
              )}

              <p className="text-sm text-gray-500 mt-1">
                Expires in {countdown}s
              </p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">
              Click Generate OTP to receive your verification code
            </p>
          )}
        </div>

        {/* Body */}
        <div className="space-y-6">
          <OTPInput value={otp} onChange={setOtp} />

          {/* Generate Button */}
          <div className="text-center">
            {countdown > 0 ? (
              <Button
                variant="green"
                onClick={onVerify}
                disabled={otp.length !== 6 || isVerifyingOtp}
                className="w-full"
              >
                {isVerifyingOtp ? 'Verifying...' : (
                  <>
                    <BiUserCheck className="w-5 h-5" />
                    Verify Code
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={onGenerate}
                disabled={isGeneratingOtp}
                className="w-full"
              >
                {isGeneratingOtp
                  ? 'Sending...'
                  : hasGeneratedOtp
                    ? 'Resend OTP'
                    : 'Generate OTP'}
              </Button>
            )}

            {/* <Button
              variant="default"
              onClick={onGenerate}
              disabled={countdown > 0}
            >
              {emailMasked ? 'Resend OTP' : 'Generate OTP'}
            </Button> */}

            {countdown > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                You can resend OTP in {countdown}s
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="default" onClick={onBack}>
              <BsArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {/* {otpActive && (
              <Button
                variant="green"
                onClick={onVerify}
                disabled={otp.length !== 6}
                className="w-full"
              >
                <BiUserCheck className="w-5 h-5" />
                Verify Code
              </Button>
            )} */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OtpVerificationForm