import type { ParcelState, PaymentState, PaymentTiming } from '@gsg/shared-types/domain'

export interface ListParcelsParams {
  query?: string
  state?: ParcelState
  paymentState?: PaymentState
  paymentTiming?: PaymentTiming
  boxId?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
}

export class ListParcelsQuery {
  constructor(public readonly params: ListParcelsParams) {}
}
