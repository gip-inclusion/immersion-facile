import * as Minio from "minio";
import { StoredFile } from "../../domain/generic/fileManagement/entity/StoredFile";
import { DocumentGateway } from "../../domain/generic/fileManagement/port/DocumentGateway";

export interface MinioParams {
  endPoint: string;
  port: number;
  accessKey: string;
  secretKey: string;
  bucketName: string;
}

export class MinioDocumentGateway implements DocumentGateway {
  private readonly baseUrl: string;
  private readonly bucketName: string;
  private readonly minioClient: Minio.Client;

  constructor(params: MinioParams) {
    const { endPoint, port, accessKey, secretKey, bucketName } = params;
    this.bucketName = bucketName;
    this.baseUrl = `${endPoint}:${port}/buckets/${bucketName}`;
    this.minioClient = new Minio.Client({
      useSSL: false,
      endPoint,
      port,
      accessKey,
      secretKey,
    });
  }

  put(file: StoredFile): Promise<void> {
    return new Promise((resolve, reject) => {
      this.minioClient.fPutObject(
        this.bucketName,
        file.name,
        file.path,
        file,
        (err) => {
          if (err) return reject(err);

          console.log("File uploaded successfully");
          console.log(file);
          return resolve();
        },
      );
    });
  }

  getFileUrl(name: string): string {
    return `${this.baseUrl}/${name}`;
  }
}
