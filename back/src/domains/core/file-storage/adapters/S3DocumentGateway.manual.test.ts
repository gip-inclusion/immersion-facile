import { expectToEqual } from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { StoredFile } from "../entity/StoredFile";
import { S3DocumentGateway } from "./S3DocumentGateway";

describe("S3DocumentGateway manual test", () => {
  const s3Params = AppConfig.createFromEnv().cellarS3Params;
  const s3Gateway = new S3DocumentGateway(s3Params);
  const file: StoredFile = {
    id: "test.txt",
    buffer: Buffer.from("content"),
    encoding: "ascii",
    mimetype: "text/plain",
    name: "testFile.txt",
    size: 2,
  };

  it("get undefined, save and get defined, delete and get undefined", async () => {
    expectToEqual(await s3Gateway.getUrl(file.id), undefined);

    await s3Gateway.save(file);

    expectToEqual(
      await s3Gateway.getUrl(file.id),
      `https://${s3Params.bucketName}.${s3Params.endPoint}/${file.id}`,
    );

    await s3Gateway.delete(file.id);

    expectToEqual(await s3Gateway.getUrl(file.id), undefined);
  });
});
