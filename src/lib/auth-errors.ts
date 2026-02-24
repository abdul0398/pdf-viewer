import { CredentialsSignin } from 'next-auth'

export class DevicePendingError extends CredentialsSignin {
  code = 'device_pending'
}

export class DeviceRejectedError extends CredentialsSignin {
  code = 'device_rejected'
}
