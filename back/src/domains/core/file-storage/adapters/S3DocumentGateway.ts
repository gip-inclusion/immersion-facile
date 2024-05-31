import * as AWS from "aws-sdk";
import { createLogger } from "../../../../utils/logger";
import { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

const logger = createLogger(__filename);

export interface S3Params {
  endPoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class S3DocumentGateway implements DocumentGateway {
  readonly #bucketName: string;

  readonly #endpoint: string;

  readonly #s3: AWS.S3;

  constructor(params: S3Params) {
    AWS.config.update({
      accessKeyId: params.accessKeyId,
      secretAccessKey: params.secretAccessKey,
    });
    this.#bucketName = params.bucketName;
    this.#endpoint = params.endPoint;
    this.#s3 = new AWS.S3({ endpoint: params.endPoint });
  }

  public getFileUrl(file: StoredFile): string {
    return `https://${this.#bucketName}.${this.#endpoint}/${file.id}`;
  }

  public async put(file: StoredFile): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#s3.putObject(
        {
          Key: file.id,
          Bucket: this.#bucketName,
          Body: file.buffer,
          ACL: "public-read",
          ContentType: file.mimetype,
        },
        (err) => {
          if (err) {
            return reject(err);
          }

          logger.info({
            message: `File uploaded successfully in bucket ${this.#bucketName}, file id : ${file.id}, file name: ${file.name}`,
          });
          return resolve();
        },
      );
    });
  }
}
