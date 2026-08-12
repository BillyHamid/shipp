import { Module } from '@nestjs/common'
import { QrModule } from '../qr/qr.module.js'
import { ParcelsModule } from '../parcels/parcels.module.js'
import { ScanController } from './scan.controller.js'
import { ScanService } from './scan.service.js'

@Module({
  imports: [QrModule, ParcelsModule],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
