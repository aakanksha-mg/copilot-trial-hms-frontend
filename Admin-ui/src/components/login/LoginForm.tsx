import { BiBuilding } from 'react-icons/bi'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent } from '../ui/card'
import DynamicFormBuilder from '../form/DynamicFormBuilder'
import { showToast } from '../ui/sonner'
import { loginSchema } from '@/schema/authSchema'
import { auth } from '@/auth'
import { CommonConstants, LoginConstants } from '@/services/constant'
import { NOTIFICATION_CONSTANTS, RoutePaths } from '@/utils/constant'


const LoginForm: any = ({ onForgotPassword, onMfaRequired }:any) => {
  const navigate = useNavigate()
  const loginformConfig = {
    gridCols: 1,
    schema: loginSchema,
    buttons: {
      gridCols: 1,
      items: [
        {
          label: 'Login',
          type: 'submit',
          variant: 'orange',
          colSpan: 1,
          icon: <BiBuilding className="w-5 h-5" />,
          size: 'md',
        },
   {
        name: 'forgot-password',
        label: 'Forgot Password?',
        type: 'link',
        placeholder: '',
        colSpan: 1,
        variant: 'btnlink',
      },
      ],
    },
    fields: [
      {
        name: 'username',
        label: 'User Name',
        type: 'text',
        placeholder: 'Enter user name',
        colSpan: 1,
        variant: 'standardone',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Enter password',
        colSpan: 1,
        variant: 'standardone',
      },
      {
        name: 'remember',
        label: 'Remember Me',
        type: 'checkbox',
        placeholder: '',
        colSpan: 1,
        variant: 'standardone',
      },
      // {
      //   name: 'forgot-password',
      //   label: 'Forgot Password?',
      //   type: 'link',
      //   placeholder: '',
      //   colSpan: 1,
      //   variant: 'standardone',
      // },
    ],
  }
  const handleSubmit = async (data: any) => {
    try {
      // navigate({ to: RoutePaths.SEARCH })
      const response = await auth.login(data)
      const { errorCode, errorMessage } = response.responseHeader
      switch (errorCode) {
        case CommonConstants.SUCCESS:
          if (response.responseBody?.loginResponse?.mfaRequired) {
            onMfaRequired?.(response.responseBody.loginResponse.userId)
          } else {
            navigate({ to: RoutePaths.SEARCH })
          }
          break
        case LoginConstants.INVALID_CREDENTIALS:
          showToast(
            NOTIFICATION_CONSTANTS.ERROR,
            errorMessage || 'Invalid Credentials',
          )
          break
        case LoginConstants.ACCOUNT_LOCKED:
          showToast(
            NOTIFICATION_CONSTANTS.ERROR,
            'Your account is locked. Contact support.',
          )
          break
        case LoginConstants.NO_ACTIVE_PRIMARY_ROLE:
          showToast(
            NOTIFICATION_CONSTANTS.WARNING,
            'No active role assigned to your account',
          )
          break
        default:
          showToast(
            NOTIFICATION_CONSTANTS.ERROR,
            errorMessage || 'Unexpected error occurred',
          )
      }
    } catch (err: any) {
      // Check if error has response data with the expected structure
      // Error can be in err.response.data (axios error) or err.data (decrypted error)
      const errorResponse = err?.response?.data || err?.data || err
      
      if (errorResponse?.responseHeader) {
        const { errorCode, errorMessage } = errorResponse.responseHeader
        switch (errorCode) {
          case LoginConstants.INVALID_CREDENTIALS:
            showToast(
              NOTIFICATION_CONSTANTS.ERROR,
              errorMessage || 'Invalid Credentials',
            )
            break
          case LoginConstants.ACCOUNT_LOCKED:
            showToast(
              NOTIFICATION_CONSTANTS.ERROR,
              errorMessage || 'Your account is locked. Contact support.',
            )
            break
          case LoginConstants.NO_ACTIVE_PRIMARY_ROLE:
            showToast(
              NOTIFICATION_CONSTANTS.WARNING,
              errorMessage || 'No active role assigned to your account',
            )
            break
          default:
            showToast(
              NOTIFICATION_CONSTANTS.ERROR,
              errorMessage || 'Unexpected error occurred',
            )
        }
      } else {
        // Fallback for unexpected error format
        const errorMsg = 
          errorResponse?.responseHeader?.errorMessage ||
          errorResponse?.errorMessage ||
          err?.message ||
          'Login failed: Unknown error'
        showToast(
          NOTIFICATION_CONSTANTS.ERROR,
          errorMsg,
        )
      }
    }
  }
  const handleFieldClick = (type: string) => {
    if (type === 'forgot-password') {
      onForgotPassword()
    }
  }
  return (
    <Card className="animate-slide-up">
      <CardContent>
        <DynamicFormBuilder
          config={loginformConfig}
          onSubmit={handleSubmit}
          onFieldClick={handleFieldClick}
        />
      </CardContent>
    </Card>
  )
}

export default LoginForm
