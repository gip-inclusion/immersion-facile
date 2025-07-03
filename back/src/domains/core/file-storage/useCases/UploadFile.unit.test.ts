import {
  AgencyDtoBuilder,
  allowedFileSignatures,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryDocumentGateway } from "../adapters/InMemoryDocumentGateway";
import type { StoredFile } from "../entity/StoredFile";
import { type FileInput, UploadFile } from "./UploadFile";

describe("UploadFile use case", () => {
  let documentGateway: InMemoryDocumentGateway;
  let uuidGenerator: TestUuidGenerator;
  let uploadFile: UploadFile;

  const backofficeAdminUserBuilder = new ConnectedUserBuilder().withIsAdmin(
    true,
  );
  const connectedBackofficeAdminUser = backofficeAdminUserBuilder.build();

  const agency = new AgencyDtoBuilder().withId("agency-id").build();
  const agencyAdminUserBuilder = new ConnectedUserBuilder().withAgencyRights([
    {
      agency: {
        ...agency,
        coveredDepartments: [],
        admins: ["admin@example.com"],
      },
      roles: ["agency-admin"],
      isNotifiedByEmail: false,
    },
  ]);
  const connectedAgencyAdminUser = agencyAdminUserBuilder.build();
  const regularUserBuilder = new ConnectedUserBuilder().withAgencyRights([]);
  const connectedRegularUser = regularUserBuilder.build();

  beforeEach(() => {
    documentGateway = new InMemoryDocumentGateway();
    uuidGenerator = new TestUuidGenerator();
    uploadFile = new UploadFile(documentGateway, uuidGenerator);
  });

  const file: FileInput = {
    buffer: Buffer.from(new Uint8Array(allowedFileSignatures.jpeg.bytes)),
    encoding: "a",
    mimetype: "image/jpeg",
    name: "file.jpg",
    size: 1,
  };

  describe("right paths", () => {
    it("File url have uuid.ext when user is agency-admin", async () => {
      const id = uuid();

      uuidGenerator.setNextUuid(id);

      const expectedFileId = `${id}.jpg`;

      expectToEqual(
        await uploadFile.execute(
          {
            file: {
              ...file,
            },
          },
          connectedAgencyAdminUser,
        ),
        `https://fakeS3/${expectedFileId}`,
      );

      expectToEqual(documentGateway.storedFiles, {
        [expectedFileId]: { id: expectedFileId, ...file },
      });
    });
    it("File url have uuid.ext when user is backoffice admin", async () => {
      const id = uuid();

      uuidGenerator.setNextUuid(id);

      const expectedFileId = `${id}.jpg`;

      expectToEqual(
        await uploadFile.execute(
          {
            file,
          },
          connectedBackofficeAdminUser,
        ),
        `https://fakeS3/${expectedFileId}`,
      );

      expectToEqual(documentGateway.storedFiles, {
        [expectedFileId]: { id: expectedFileId, ...file },
      });
    });
  });

  describe("Wrong path", () => {
    it("throws UnauthorizedError if no connected user provided", async () => {
      await expectPromiseToFailWithError(
        uploadFile.execute({ file }, undefined),
        errors.user.unauthorized(),
      );
    });

    it("throws ForbiddenError if connected user is not admin nor agency-admin", async () => {
      await expectPromiseToFailWithError(
        uploadFile.execute({ file }, connectedRegularUser),
        errors.user.forbidden({ userId: connectedRegularUser.id }),
      );
    });

    it("throws ConflictError file created exist with same id, already stored file not replaced", async () => {
      const id = uuidGenerator.new();

      uuidGenerator.setNextUuid(id);

      const expectedFileId = `${id}.jpg`;

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
        uploadFile.execute({ file }, connectedAgencyAdminUser),
        errors.file.fileAlreadyExist(expectedFileId),
      );

      expectToEqual(documentGateway.storedFiles, {
        [alreadyStoredFile.id]: alreadyStoredFile,
      });
    });

    it("throws BadRequestError if user is agency-admin and file extension is invalid", async () => {
      await expectPromiseToFailWithError(
        uploadFile.execute(
          { file: { ...file, name: "file.txt" } },
          connectedAgencyAdminUser,
        ),
        errors.file.invalidFile({
          code: "INVALID_EXTENSION",
          message:
            "Invalid file extension. Allowed extensions: pdf, jpeg, jpg, png, webp, svg",
        }),
      );
    });

    it("throws BadRequestError if user is agency-admin and file mime type is invalid", async () => {
      await expectPromiseToFailWithError(
        uploadFile.execute(
          { file: { ...file, name: "file.pdf", mimetype: "image/gif" } },
          connectedAgencyAdminUser,
        ),
        errors.file.invalidFile({
          code: "INVALID_MIME_TYPE",
          message:
            "Invalid mime type. Allowed types: application/pdf, image/jpeg, image/png, image/jpg, image/webp, image/svg+xml",
        }),
      );
    });
  });
});
