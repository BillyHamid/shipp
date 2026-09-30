export class RecordParcelConditionCommand {
  constructor(
    public readonly parcelId: string,
    public readonly condition: string,
    public readonly note: string | undefined,
    public readonly photoDataUrl: string | undefined,
    public readonly actorId: string,
  ) {}
}
