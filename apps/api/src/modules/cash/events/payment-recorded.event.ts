export class PaymentRecordedDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly cashAccountId: string,
    public readonly currency: 'USD' | 'XOF',
    public readonly amount: number,
    public readonly trackingNumber: string,
  ) {}
}
