export class BoxUpdatedDomainEvent {
  constructor(
    public readonly boxId: string,
    public readonly reference: string,
    public readonly status: string,
  ) {}
}
