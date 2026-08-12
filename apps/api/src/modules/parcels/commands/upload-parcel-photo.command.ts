export class UploadParcelPhotoCommand {
  constructor(
    public readonly parcelId: string,
    public readonly photoDataUrl: string,
    public readonly actorId: string,
  ) {}
}
