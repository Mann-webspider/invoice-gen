/**
 * Every channel the renderer may invoke.
 *
 * Replaces the 40+ REST routes in backend/src/routes.php. Note `master:*` —
 * the old backend had five near-identical controllers (exporter, supplier, ARN,
 * product-category, country-category, product-size, dropdown-options) with
 * copy-pasted CRUD. Here they collapse into one channel set keyed by entity.
 */
export const CH = {
  app: {
    info: 'app:info'
  },
  auth: {
    login: 'auth:login',
    logout: 'auth:logout',
    session: 'auth:session',
    setPassword: 'auth:setPassword',
    createAdmin: 'auth:createAdmin',
    changePassword: 'auth:changePassword'
  },
  master: {
    list: 'master:list',
    create: 'master:create',
    update: 'master:update',
    remove: 'master:remove',
    reorder: 'master:reorder'
  },
  asset: {
    pick: 'asset:pick',
    get: 'asset:get',
    remove: 'asset:remove'
  },
  invoice: {
    list: 'invoice:list',
    get: 'invoice:get',
    create: 'invoice:create',
    remove: 'invoice:remove',
    allocateNumber: 'invoice:allocateNumber'
  },
  draft: {
    list: 'draft:list',
    get: 'draft:get',
    save: 'draft:save',
    remove: 'draft:remove'
  },
  document: {
    generate: 'document:generate',
    list: 'document:list',
    open: 'document:open',
    reveal: 'document:reveal',
    saveAs: 'document:saveAs'
  },
  backup: {
    create: 'backup:create',
    list: 'backup:list',
    restore: 'backup:restore',
    remove: 'backup:remove',
    export: 'backup:export',
    relaunch: 'backup:relaunch'
  }
} as const

/** Main → renderer pushes. Drives the ProcessQueue progress panel. */
export const EVT = {
  documentProgress: 'evt:documentProgress'
} as const

export type Channel =
  | (typeof CH)[keyof typeof CH][keyof (typeof CH)[keyof typeof CH]]
  | string
