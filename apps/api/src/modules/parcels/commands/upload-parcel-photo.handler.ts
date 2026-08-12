import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../common/prisma/prisma.service.js'
import { UploadParcelPhotoCommand } from './upload-parcel-photo.command.js'

/**
 * Records a proof-of-delivery photo as a ParcelEvent (not a Parcel field).
 * Keeping photos in the event log (not on Parcel) preserves the append-only
 * invariant and lets us store *multiple* photos per parcel over its lifetime.
 *
 * NOTE: for production, swap storing the raw dataURL for an upload to
 * object storage (S3-compatible) and store only the resulting key here.
 */
@CommandHandler(UploadParcelPhotoCommand)
export class UploadParcelPhotoHandler implements ICommandHandler<UploadParcelPhotoCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(cmd: UploadParcelPhotoCommand): Promise<void> {
    const parcel = await this.prisma.parcel.findUnique({ where: { id: cmd.parcelId } })
    if (!parcel) throw new NotFoundException(`Parcel ${cmd.parcelId} not found`)

    await this.prisma.parcelEvent.create({
      data: {
        parcelId: cmd.parcelId,
        eventType: 'photo_uploaded',
        action: 'upload_photo',
        actorId: cmd.actorId,
        metadata: { photo: cmd.photoDataUrl },
      },
    })
  }
}
