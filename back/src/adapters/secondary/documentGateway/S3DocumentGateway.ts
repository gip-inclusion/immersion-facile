import * as AWS from "aws-sdk";
import { StoredFile } from "../../../domain/generic/fileManagement/entity/StoredFile";
import { DocumentGateway } from "../../../domain/generic/fileManagement/port/DocumentGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export interface S3Params {
  endPoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class S3DocumentGateway implements DocumentGateway {
  private readonly bucketName: string;

  private readonly endpoint: string;

  private readonly s3: AWS.S3;

  constructor(params: S3Params) {
    AWS.config.update({
      accessKeyId: params.accessKeyId,
      secretAccessKey: params.secretAccessKey,
    });
    this.bucketName = params.bucketName;
    this.endpoint = params.endPoint;
    this.s3 = new AWS.S3({ endpoint: params.endPoint });
  }

  getFileUrl(file: StoredFile): string {
    return `https://${this.bucketName}.${this.endpoint}/${file.id}`;
  }

  async put(file: StoredFile): Promise<void> {
    return new Promise((resolve, reject) => {
      this.s3.putObject(
        {
          Key: file.id,
          Bucket: this.bucketName,
          Body: file.buffer,
          ACL: "public-read",
        },
        (err) => {
          if (err) {
            return reject(err);
          }

          logger.info(
            `File uploaded successfully in bucket ${this.bucketName}, file id : ${file.id}, file name: ${file.name}`,
          );
          return resolve();
        },
      );
    });
  }
}
