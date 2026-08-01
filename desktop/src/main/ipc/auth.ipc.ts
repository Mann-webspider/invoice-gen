import { CH } from '@shared/ipc-channels'
import {
  ChangePasswordInput,
  CreateAdminInput,
  LoginInput,
  SetPasswordInput,
  type SessionState,
  type SessionUser
} from '@shared/contracts'
import * as auth from '../services/auth.service'
import { handle } from './guard'

export const registerAuthIpc = (): void => {
  handle<void, SessionState>(CH.auth.session, null, () => auth.getSession())
  handle(CH.auth.login, LoginInput, (input): Promise<SessionUser> => auth.login(input))
  handle<void, null>(CH.auth.logout, null, () => auth.logout())
  handle(CH.auth.setPassword, SetPasswordInput, (input) => auth.setPassword(input))
  handle(CH.auth.createAdmin, CreateAdminInput, (input) => auth.createAdmin(input))
  handle(CH.auth.changePassword, ChangePasswordInput, (input) => auth.changePassword(input))
}
