import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { BoxesController } from './boxes.controller.js'
import { BoxesService } from './boxes.service.js'
import { BoxReferenceFactory } from './box-reference.factory.js'

@Module({
  imports: [CqrsModule],
  controllers: [BoxesController],
  providers: [BoxesService, BoxReferenceFactory],
  exports: [BoxesService, BoxReferenceFactory],
})
export class BoxesModule {}
