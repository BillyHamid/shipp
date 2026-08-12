import { CreateParcelHandler } from './create-parcel.handler.js'
import { TransitionParcelHandler } from './transition-parcel.handler.js'
import { UploadParcelPhotoHandler } from './upload-parcel-photo.handler.js'

export const PARCEL_COMMAND_HANDLERS = [
  CreateParcelHandler,
  TransitionParcelHandler,
  UploadParcelPhotoHandler,
]

export * from './create-parcel.command.js'
export * from './transition-parcel.command.js'
export * from './upload-parcel-photo.command.js'
