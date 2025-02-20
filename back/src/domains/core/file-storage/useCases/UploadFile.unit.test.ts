import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryDocumentGateway } from "../adapters/InMemoryDocumentGateway";
import { StoredFile } from "../entity/StoredFile";
import { FileInput, UploadFile } from "./UploadFile";

describe("UploadFile use case", () => {
  let documentGateway: InMemoryDocumentGateway;
  let uuidGenerator: TestUuidGenerator;
  let uploadFile: UploadFile;

  const backofficeAdminUserBuilder =
    new InclusionConnectedUserBuilder().withIsAdmin(true);
  const icBackofficeAdminUser = backofficeAdminUserBuilder.build();

  const agency = new AgencyDtoBuilder().withId("agency-id").build();
  const agencyAdminUserBuilder =
    new InclusionConnectedUserBuilder().withAgencyRights([
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
  const icAgencyAdminUser = agencyAdminUserBuilder.build();
  const regularUserBuilder =
    new InclusionConnectedUserBuilder().withAgencyRights([]);
  const icRegularUser = regularUserBuilder.build();

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
    it("File url have uuid.ext when user is agency-admin", async () => {
      const id = uuid();

      uuidGenerator.setNextUuid(id);

      const expectedFileId = `${id}.tmp`;

      expectToEqual(
        await uploadFile.execute(
          {
            file,
          },
          icAgencyAdminUser,
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

      const expectedFileId = `${id}.tmp`;

      expectToEqual(
        await uploadFile.execute(
          {
            file,
          },
          icBackofficeAdminUser,
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
        uploadFile.execute({ file }, icRegularUser),
        errors.user.forbidden({ userId: icRegularUser.id }),
      );
    });

    it("throws ConflictError file created exist with same id, already stored file not replaced", async () => {
      const id = uuidGenerator.new();

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
        uploadFile.execute({ file }, icAgencyAdminUser),
        errors.file.fileAlreadyExist(expectedFileId),
      );

      expectToEqual(documentGateway.storedFiles, {
        [alreadyStoredFile.id]: alreadyStoredFile,
      });
    });
  });
});
