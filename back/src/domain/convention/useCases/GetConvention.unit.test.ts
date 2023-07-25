import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionId,
  ConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  InclusionConnectedUser,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  TEST_AGENCY_DEPARTMENT,
  TEST_AGENCY_NAME,
} from "../../../adapters/secondary/InMemoryConventionQueries";
import { conventionIdAllowedForIcUser } from "../../../adapters/secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetConvention } from "./GetConvention";

describe("Get Convention", () => {
  let getConvention: GetConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
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
  });

  describe("With inclusion connected user", () => {
    it("throws if user is not allowed to access the convention (convention not linked to one of it's agencies)", async () => {
      const conventionId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";
      await expectPromiseToFailWithError(
        getConvention.execute({ conventionId }, { userId: "my-user-id" }),
        new ForbiddenError(
          `User with id 'my-user-id' is not allowed to access convention with id '${conventionId}'`,
        ),
      );
    });

    it("gets it if icUser has enough rights for the agency linked to the convention", async () => {
      const agency = new AgencyDtoBuilder().build();
      uow.agencyRepository.setAgencies([agency]);
      const entity = new ConventionDtoBuilder()
        .withId(conventionIdAllowedForIcUser)
        .withAgencyId(agency.id)
        .build();
      uow.conventionRepository.setConventions({ [entity.id]: entity });

      const user: InclusionConnectedUser = {
        id: "my-user-id",
        email: "my-user@email.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [{ role: "validator", agency }],
      };
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([user]);

      const fetchedConvention = await getConvention.execute(
        { conventionId: entity.id },
        { userId: "my-user-id" },
      );

      expectToEqual(fetchedConvention, {
        ...entity,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      });
    });
  });

  describe("When a Convention is stored", () => {
    it("returns the Convention", async () => {
      const entity = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions({ [entity.id]: entity });

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
