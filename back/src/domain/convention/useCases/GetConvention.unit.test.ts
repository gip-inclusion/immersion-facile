import {
  AgencyDtoBuilder,
  BackOfficeJwtPayload,
  ConventionDtoBuilder,
  ConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  InclusionConnectDomainJwtPayload,
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
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetConvention } from "./GetConvention";

describe("Get Convention", () => {
  const agency = new AgencyDtoBuilder().build();
  const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();
  let getConvention: GetConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getConvention = new GetConvention(new InMemoryUowPerformer(uow));
  });

  describe("Wrong paths", () => {
    describe("Forbidden error", () => {
      it("When no auth payload provided", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }),
          new ForbiddenError(`No auth payload provided`),
        );
      });

      it("When convention id in jwt token does not match provided one", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }, {
            role: "establishment",
            applicationId: "not-matching-convention-id",
          } as ConventionMagicLinkPayload),
          new ForbiddenError(
            `This token is not allowed to access convention with id ${convention.id}. Role was 'establishment'`,
          ),
        );
      });

      it("When the user don't have correct role on inclusion connected users", async () => {
        const user: InclusionConnectedUser = {
          id: "my-user-id",
          email: "my-user@email.com",
          firstName: "John",
          lastName: "Doe",
          agencyRights: [{ role: "toReview", agency }],
        };
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([user]);
        uow.agencyRepository.setAgencies([agency]);
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });

        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            { userId: "my-user-id" },
          ),
          new ForbiddenError(
            `User with id 'my-user-id' is not allowed to access convention with id '${convention.id}'`,
          ),
        );
      });
    });

    describe("Not found error", () => {
      it("When the Convention does not exist", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }, {
            role: "establishment",
            applicationId: convention.id,
          } as ConventionMagicLinkPayload),
          new NotFoundError(`No convention found with id ${convention.id}`),
        );
      });

      it("When if user is not on inclusion connected users", async () => {
        uow.agencyRepository.setAgencies([agency]);
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        const userId = "my-user-id";

        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }, { userId }),
          new NotFoundError(`No user found with id '${userId}'`),
        );
      });
    });
  });

  describe("Right paths", () => {
    beforeEach(() => {
      uow.agencyRepository.setAgencies([agency]);
      uow.conventionRepository.setConventions({ [convention.id]: convention });
    });

    it("Inclusion connected user", async () => {
      const user: InclusionConnectedUser = {
        id: "my-user-id",
        email: "my-user@email.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [{ role: "validator", agency }],
      };
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([user]);
      const jwtPayload: InclusionConnectDomainJwtPayload = {
        userId: "my-user-id",
      };

      const fetchedConvention = await getConvention.execute(
        { conventionId: convention.id },
        jwtPayload,
      );

      expectToEqual(fetchedConvention, {
        ...convention,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      });
    });

    it("with ConventionMagicLinkPayload", async () => {
      const payload: ConventionMagicLinkPayload = {
        role: "establishment",
        emailHash: "",
        applicationId: convention.id,
        iat: 1,
        version: 1,
      };

      const conventionResult = await getConvention.execute(
        { conventionId: convention.id },
        payload,
      );

      expectToEqual(conventionResult, {
        ...convention,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      });
    });

    it("with BackOfficeJwtPayload", async () => {
      const payload: BackOfficeJwtPayload = {
        role: "backOffice",
        sub: "",
        iat: 1,
        version: 1,
      };

      const conventionResult = await getConvention.execute(
        { conventionId: convention.id },
        payload,
      );

      expectToEqual(conventionResult, {
        ...convention,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      });
    });
  });
});
