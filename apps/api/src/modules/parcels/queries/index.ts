import { ListParcelsHandler } from './list-parcels.handler.js'
import { GetParcelHandler, GetParcelEventsHandler } from './get-parcel.handler.js'

export const PARCEL_QUERY_HANDLERS = [ListParcelsHandler, GetParcelHandler, GetParcelEventsHandler]

export * from './list-parcels.query.js'
export * from './get-parcel.query.js'
