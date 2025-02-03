import { errors, expectPromiseToFailWithError, expectToEqual } from "shared";
import { v4 as uuid } from "uuid";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryDocumentGateway } from "../adapters/InMemoryDocumentGateway";
import { StoredFile } from "../entity/StoredFile";
import { FileInput, UploadFile } from "./UploadFile";

describe("SetFeatureFlag use case", () => {
  let documentGateway: InMemoryDocumentGateway;
  let uuidGenerator: TestUuidGenerator;
  let uploadFile: UploadFile;

  beforeEach(() => {
    documentGateway = new InMemoryDocumentGateway();
    uuidGenerator = new TestUuidGenerator();
    uploadFile = new UploadFile(documentGateway, uuidGenerator);
  });

  const file: FileInput = {
    buffer: Buffer.from("toto"),
    encoding: "a",
    mimetype: "a",
    name: "file.tmp",
    size: 1,
  };

  describe("right paths", () => {
    it("File url have filename.ext when renameFileToId is disabled", async () => {
      expectToEqual(
        await uploadFile.execute({
          file: file,
          renameFileToId: false,
        }),
        `https://fakeS3/${file.name}`,
      );

      expectToEqual(documentGateway.storedFiles, {
        [file.name]: { id: file.name, ...file },
      });
    });

    it("File url have uuid.ext when renameFileToId is enabled", async () => {
      const id = uuid();

      uuidGenerator.setNextUuid(id);

      const expectedFileId = `${id}.tmp`;

      expectToEqual(
        await uploadFile.execute({
          file: file,
        }),
        `https://fakeS3/${expectedFileId}`,
      );

      expectToEqual(documentGateway.storedFiles, {
        [expectedFileId]: { id: expectedFileId, ...file },
      });
    });
  });

  describe("Wrong path", () => {
    it("throws ConflictError file created with renameFileToId enabled exist with same id, already stored file not replaced", async () => {
      const id = uuid();

      uuidGenerator.setNextUuid(id);

      const expectedFileId = `${id}.tmp`;

      const alreadyStoredFile: StoredFile = {
        id: expectedFileId,
        buffer: Buffer.from("already stored file"),
        encoding: "",
        mimetype: "",
        name: "other.tmp",
        size: 2,
      };

      documentGateway.storedFiles = {
        [alreadyStoredFile.id]: alreadyStoredFile,
      };

      await expectPromiseToFailWithError(
        uploadFile.execute({
          file,
        }),
        errors.file.fileAlreadyExist(expectedFileId),
      );

      expectToEqual(documentGateway.storedFiles, {
        [alreadyStoredFile.id]: alreadyStoredFile,
      });
    });

    it("throws ConflictError file created with renameFileToId disabled exist with same id, already stored file not replaced", async () => {
      const alreadyStoredFile: StoredFile = {
        id: file.name,
        buffer: Buffer.from("already stored file"),
        encoding: "",
        mimetype: "",
        name: "other.tmp",
        size: 2,
      };

      documentGateway.storedFiles = {
        [alreadyStoredFile.id]: alreadyStoredFile,
      };

      await expectPromiseToFailWithError(
        uploadFile.execute({
          file,
          renameFileToId: false,
        }),
        errors.file.fileAlreadyExist(alreadyStoredFile.id),
      );

      expectToEqual(documentGateway.storedFiles, {
        [alreadyStoredFile.id]: alreadyStoredFile,
      });
    });
  });
});
