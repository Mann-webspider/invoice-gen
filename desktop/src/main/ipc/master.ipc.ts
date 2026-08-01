import { CH } from '@shared/ipc-channels'
import {
  MasterCreateInput,
  MasterListInput,
  MasterRemoveInput,
  MasterReorderInput,
  MasterUpdateInput
} from '@shared/contracts'
import * as master from '../services/master.service'
import { requireAdmin, requireUser } from '../services/auth.service'
import { handle } from './guard'

/**
 * Reading master data is what the invoice wizard does all day, so any signed-in
 * user may list. Editing it is an administrator action — the same split the web
 * app intended with `requireAdmin` on its /admin route and then never enforced
 * anywhere on the server.
 */
export const registerMasterIpc = (): void => {
  handle(CH.master.list, MasterListInput, (input) => {
    requireUser()
    return master.listMaster(input)
  })

  handle(CH.master.create, MasterCreateInput, (input) => {
    requireAdmin()
    return master.createMaster(input.entity, input.data)
  })

  handle(CH.master.update, MasterUpdateInput, (input) => {
    requireAdmin()
    return master.updateMaster(input.entity, input.id, input.data)
  })

  handle(CH.master.remove, MasterRemoveInput, (input) => {
    requireAdmin()
    return master.removeMaster(input.entity, input.id)
  })

  handle(CH.master.reorder, MasterReorderInput, (input) => {
    requireAdmin()
    return master.reorderMaster(input)
  })
}
