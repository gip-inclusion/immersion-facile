import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import type { AbsoluteUrl, StoredFileId } from "shared";
import { createLogger } from "../../../../utils/logger";
import type { StoredFile } from "../entity/StoredFile";
import type { DocumentGateway } from "../port/DocumentGateway";

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

  readonly #s3: S3Client;

  constructor(params: S3Params) {
    this.#bucketName = params.bucketName;
    this.#endpoint = params.endPoint;
    const s3ClientConfig: S3ClientConfig = {
      endpoint: `https://${params.endPoint}`,
      region: "us-east-1", // obligatoire même avec endpoint custom
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
      },
    };
    this.#s3 = new S3Client(s3ClientConfig);
  }

  public async getUrl(fileId: StoredFileId): Promise<AbsoluteUrl | undefined> {
    return this.#s3
      .send(
        new GetObjectCommand({
          Bucket: this.#bucketName,
          Key: fileId,
        }),
      )
      .then((_getObjectCommandOutput) => {
        this.onClientRequestFinished();
        return `https://${this.#bucketName}.${this.#endpoint}/${fileId}` satisfies AbsoluteUrl;
      })
      .catch((error) => {
        logger.error({ error });
        return undefined;
      });
  }

  public async save(file: StoredFile): Promise<void> {
    return this.#s3
      .send(
        new PutObjectCommand({
          Key: file.id,
          Bucket: this.#bucketName,
          Body: file.buffer,
          ACL: "public-read",
          ContentType: file.mimetype,
        }),
      )
      .then((_putObjectCommandOutput) => {
        logger.info({
          message: `File uploaded successfully in bucket ${this.#bucketName}, file id : ${file.id}, file name: ${file.name}`,
        });
        return this.onClientRequestFinished();
      });
  }

  //For reset testing
  public async delete(id: StoredFileId): Promise<void> {
    return this.#s3
      .send(
        new DeleteObjectCommand({
          Bucket: this.#bucketName,
          Key: id,
        }),
      )
      .then((_deleteObjectCommandOutput) => this.onClientRequestFinished());
  }

  private onClientRequestFinished(): void {
    // Force close client socket : avoid 'Jest did not exit one second after the test run has completed.'
    this.#s3.destroy();
  }
}
