import {
  ConventionDtoBuilder,
  ConventionId,
  ConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  TEST_AGENCY_DEPARTMENT,
  TEST_AGENCY_NAME,
} from "../../../adapters/secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetConvention } from "./GetConvention";

describe("Get Convention", () => {
  let getConvention: GetConvention;
  let conventionRepository: InMemoryConventionRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionRepository = uow.conventionRepository;
    getConvention = new GetConvention(new InMemoryUowPerformer(uow));
  });

  describe("When the Convention does not exist", () => {
    it("throws NotFoundError", async () => {
      const conventionId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";
      await expectPromiseToFailWithError(
        getConvention.execute({ conventionId }, {
          role: "establishment",
          applicationId: "add5c20e-6dd2-45af-affe-927358005251",
        } as ConventionMagicLinkPayload),
        new NotFoundError(`No convention found with id ${conventionId}`),
      );
    });
  });

  describe("When user is forbidden", () => {
    it("no auth payload provided", async () => {
      const conventionId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";
      await expectPromiseToFailWithError(
        getConvention.execute({ conventionId }),
        new ForbiddenError(`No auth payload provided`),
      );
    });

    it("convention id in jwt token does not match provided one", async () => {
      const conventionId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";
      await expectPromiseToFailWithError(
        getConvention.execute({ conventionId }, {
          role: "establishment",
          applicationId: "not-matching-convention-id",
        } as ConventionMagicLinkPayload),
        new ForbiddenError(
          `This token is not allowed to access convention with id ${conventionId}. Role was 'establishment'`,
        ),
      );
    });

    it("user is not allowed to access the convention (convention not linked to one of it's agencies)", async () => {
      const conventionId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";
      await expectPromiseToFailWithError(
        getConvention.execute({ conventionId }, { userId: "my-user-id" }),
        new ForbiddenError("TODO : handle inclusion connected user"),
      );
    });
  });

  describe("When a Convention is stored", () => {
    it("returns the Convention", async () => {
      const entity = new ConventionDtoBuilder().build();
      conventionRepository.setConventions({ [entity.id]: entity });

      const convention = await getConvention.execute(
        {
          conventionId: entity.id,
        },
        {
          role: "establishment",
          applicationId: entity.id,
        } as ConventionMagicLinkPayload,
      );
      expectToEqual(convention, {
        ...entity,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      });
    });
  });
});
