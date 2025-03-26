import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './upload-files.service';

@Module({
  controllers: [UploadsController],
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class UploadsModule {}
