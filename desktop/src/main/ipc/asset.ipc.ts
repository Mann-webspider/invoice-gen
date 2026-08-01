import { CH } from '@shared/ipc-channels'
import { AssetGetInput, AssetPickInput } from '@shared/contracts'
import * as assets from '../services/asset.service'
import { requireAdmin, requireUser } from '../services/auth.service'
import { handle } from './guard'

export const registerAssetIpc = (): void => {
  handle(CH.asset.get, AssetGetInput, (input) => {
    requireUser()
    return assets.getAsset(input)
  })

  handle(CH.asset.pick, AssetPickInput, (input) => {
    requireAdmin()
    return assets.pickAsset(input)
  })

  handle(CH.asset.remove, AssetGetInput, (input) => {
    requireAdmin()
    return assets.removeAsset(input)
  })
}
