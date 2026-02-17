import { AwsClient } from "aws4fetch";
import {
  type AbsoluteUrl,
  absoluteUrlSchema,
  errors,
  type StoredFileId,
} from "shared";
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
  readonly #client: AwsClient;

  constructor(params: S3Params) {
    this.#bucketName = params.bucketName;
    this.#endpoint = params.endPoint;
    this.#client = new AwsClient({
      accessKeyId: params.accessKeyId,
      secretAccessKey: params.secretAccessKey,
      service: "s3",
    });
  }

  public async getUrl(fileId: StoredFileId): Promise<AbsoluteUrl | undefined> {
    return this.awsSignedFetch(fileId, "HEAD").then(async (response) => {
      if (response.status === 404) return undefined;
      if (response.status === 200) return absoluteUrlSchema.parse(response.url);
      throw await errors.fetch.errorResponse(response);
    });
  }

  public async save(file: StoredFile): Promise<void> {
    return this.awsSignedFetch(file.id, "PUT", file.buffer, {
      "content-type": file.mimetype,
      "x-amz-acl": "public-read",
    }).then(async (response) => {
      if (response.status === 200) {
        logger.info({
          message: `File uploaded successfully in bucket ${this.#bucketName}, file id : ${file.id}, file name: ${file.name}`,
        });
        return;
      }
      throw await errors.fetch.errorResponse(response);
    });
  }

  //For reset testing
  public async delete(id: StoredFileId): Promise<void> {
    return this.awsSignedFetch(id, "DELETE").then(async (response) => {
      if (response.status === 204) return;
      throw await errors.fetch.errorResponse(response);
    });
  }

  private async awsSignedFetch(
    fileId: StoredFileId,
    method: "HEAD" | "PUT" | "DELETE",
    body?: Buffer,
    headers?: Record<string, string>,
  ): Promise<Response> {
    return this.#client.fetch(
      `https://${this.#bucketName}.${this.#endpoint}/${fileId}`,
      {
        body,
        method,
        headers,
      },
    );
  }
}
