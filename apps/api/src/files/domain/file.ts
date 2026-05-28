import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Transform } from 'class-transformer';
import fileConfig from '../config/file.config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';

export class FileType {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Allow()
  id: string;

  @ApiProperty({
    type: String,
    example: 'https://example.com/path/to/file.jpg',
  })
  @Transform(
    ({ value }) => {
      const cfg = fileConfig() as FileConfig;
      if (cfg.driver === FileDriver.LOCAL) {
        return (appConfig() as AppConfig).backendDomain + value;
      } else if (cfg.driver === FileDriver.S3) {
        const endpoint =
          cfg.s3Endpoint ?? `https://s3.${cfg.awsS3Region}.amazonaws.com`;
        return `${endpoint}/${cfg.awsDefaultS3Bucket}/${value}`;
      } else if (cfg.driver === FileDriver.S3_PRESIGNED) {
        const s3 = new S3Client({
          region: cfg.awsS3Region ?? '',
          credentials: {
            accessKeyId: cfg.accessKeyId ?? '',
            secretAccessKey: cfg.secretAccessKey ?? '',
          },
          ...(cfg.s3Endpoint && {
            endpoint: cfg.s3Endpoint,
            forcePathStyle: true,
          }),
        });

        const command = new GetObjectCommand({
          Bucket: cfg.awsDefaultS3Bucket ?? '',
          Key: value,
        });

        return getSignedUrl(s3, command, { expiresIn: 3600 });
      }

      return value;
    },
    {
      toPlainOnly: true,
    },
  )
  path: string;

  @ApiProperty({ type: String })
  @Allow()
  name?: string;

  @ApiProperty({ type: Number })
  @Allow()
  size?: number;

  @ApiProperty({ type: String })
  @Allow()
  mimeType?: string;

  @ApiProperty({ type: String })
  @Allow()
  createdAt?: string;
}
