import { CH } from '@shared/ipc-channels'
import {
  ChangePasswordInput,
  CreateAdminInput,
  LoginInput,
  SetPasswordInput,
  type SessionState
} from '@shared/contracts'
import * as auth from '../services/auth.service'
import { handle } from './guard'

export const registerAuthIpc = (): void => {
  handle(CH.auth.session, null, (): SessionState => auth.getSession())
  handle(CH.auth.login, LoginInput, (input) => auth.login(input))
  handle(CH.auth.logout, null, () => auth.logout())
  handle(CH.auth.setPassword, SetPasswordInput, (input) => auth.setPassword(input))
  handle(CH.auth.createAdmin, CreateAdminInput, (input) => auth.createAdmin(input))
  handle(CH.auth.changePassword, ChangePasswordInput, (input) => auth.changePassword(input))
}
