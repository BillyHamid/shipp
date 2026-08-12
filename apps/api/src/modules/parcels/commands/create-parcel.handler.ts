import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'
import { Parcel } from '@prisma/client'
import { PrismaService } from '../../../common/prisma/prisma.service.js'
import { TrackingNumberFactory } from '../domain/tracking-number.factory.js'
import { QrService } from '../../qr/qr.service.js'
import { PricingService } from '../../pricing/pricing.service.js'
import { estimateDeliveryDate } from '../domain/estimated-delivery.js'
import { ParcelCreatedDomainEvent } from '../events/parcel-transitioned.event.js'
import { CreateParcelCommand } from './create-parcel.command.js'

@CommandHandler(CreateParcelCommand)
export class CreateParcelHandler implements ICommandHandler<CreateParcelCommand, Parcel> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingNumbers: TrackingNumberFactory,
    private readonly qr: QrService,
    private readonly pricing: PricingService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateParcelCommand): Promise<Parcel> {
    const { dto, createdById } = cmd

    const [sender, recipient] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: dto.senderId } }),
      this.prisma.customer.findUnique({ where: { id: dto.recipientId } }),
    ])
    if (!sender) throw new BadRequestException(`Sender ${dto.senderId} not found`)
    if (!recipient) throw new BadRequestException(`Recipient ${dto.recipientId} not found`)

    const quote = await this.pricing.quote({
      category: dto.category,
      weightKg: dto.weightKg,
      originCountry: dto.originCountry,
      destCountry: dto.destCountry,
    })

    const trackingNumber = await this.trackingNumbers.generate(dto.originCountry)
    const qrSignature = this.qr.sign(trackingNumber)

    const parcel = await this.prisma.$transaction(async (tx) => {
      const created = await tx.parcel.create({
        data: {
          trackingNumber,
          qrSignature,
          senderId: dto.senderId,
          recipientId: dto.recipientId,
          category: dto.category,
          description: dto.description ?? null,
          weightKg: dto.weightKg,
          declaredValue: dto.declaredValue ?? null,
          originCountry: dto.originCountry,
          destCountry: dto.destCountry,
          priceUsd: quote.priceUsd,
          priceXof: quote.priceXof,
          exchangeRate: quote.exchangeRate,
          currentState: 'registered',
          paymentState: 'pending',
          estimatedDelivery: estimateDeliveryDate('registered'),
          createdById,
        },
      })

      await tx.parcelEvent.create({
        data: {
          parcelId: created.id,
          eventType: 'state_transition',
          action: 'register',
          fromState: null,
          toState: 'registered',
          actorId: createdById,
          scanned: false,
          metadata: { note: 'Parcel registered in the system' },
        },
      })

      return created
    })

    this.eventBus.publish(new ParcelCreatedDomainEvent(parcel))
    return parcel
  }
}
