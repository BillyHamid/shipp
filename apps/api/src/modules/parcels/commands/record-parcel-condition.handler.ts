import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../common/prisma/prisma.service.js'
import { RecordParcelConditionCommand } from './record-parcel-condition.command.js'

@CommandHandler(RecordParcelConditionCommand)
export class RecordParcelConditionHandler implements ICommandHandler<RecordParcelConditionCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RecordParcelConditionCommand): Promise<void> {
    const parcel = await this.prisma.parcel.findUnique({ where: { id: command.parcelId } })
    if (!parcel) throw new NotFoundException(`Parcel ${command.parcelId} not found`)

    await this.prisma.parcelEvent.create({
      data: {
        parcelId: command.parcelId,
        eventType: 'condition_checked',
        action: 'record_condition',
        actorId: command.actorId,
        scanned: true,
        metadata: {
          stage: ['arrived_country', 'customs', 'out_for_delivery', 'delivered'].includes(parcel.currentState)
            ? 'arrival'
            : 'departure',
          condition: command.condition,
          note: command.note,
          photo: command.photoDataUrl,
        },
      },
    })
  }
}
