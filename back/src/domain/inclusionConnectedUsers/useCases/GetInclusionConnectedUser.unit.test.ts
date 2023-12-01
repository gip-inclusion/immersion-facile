import {
  AgencyDtoBuilder,
  allAgencyRoles,
  AuthenticatedUser,
  ConventionDtoBuilder,
  expectPromiseToFailWith,
  expectToEqual,
  InclusionConnectedUser,
  InclusionConnectJwtPayload,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { StubDashboardGateway } from "../../../adapters/secondary/dashboardGateway/StubDashboardGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetInclusionConnectedUser } from "./GetInclusionConnectedUser";

const userId = "123";
const inclusionConnectJwtPayload: InclusionConnectJwtPayload = {
  exp: 0,
  iat: 0,
  version: 1,
  userId,
};
const john: AuthenticatedUser = {
  id: userId,
  email: "john@mail.com",
  firstName: "John",
  lastName: "Doe",
};

describe("GetUserAgencyDashboardUrl", () => {
  let getInclusionConnectedUser: GetInclusionConnectedUser;
  let uowPerformer: InMemoryUowPerformer;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    timeGateway = new CustomTimeGateway();
    getInclusionConnectedUser = new GetInclusionConnectedUser(
      uowPerformer,
      new StubDashboardGateway(),
      timeGateway,
    );
  });

  it("throws NotFoundError if the user is not found", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute(undefined, inclusionConnectJwtPayload),
      `No user found with provided ID : ${userId}`,
    );
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute(),
      "No JWT token provided",
    );
  });

  const [agencyRolesAllowedToGetDashboard, agencyRolesForbiddenToGetDashboard] =
    splitCasesBetweenPassingAndFailing(allAgencyRoles, [
      "agencyOwner",
      "validator",
      "counsellor",
    ]);

  it.each(agencyRolesAllowedToGetDashboard)(
    "returns the dashboard url when role is '%s'",
    async (agencyUserRole) => {
      const agency = new AgencyDtoBuilder().build();
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        { ...john, agencyRights: [{ agency, role: agencyUserRole }] },
      ]);
      const url = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(url, {
        ...john,
        agencyRights: [{ agency, role: agencyUserRole }],
        agencyDashboardUrl: `http://stubAgencyDashboard/${agency.id}`,
      }); // coming from StubDashboardGateway
    },
  );

  it.each(agencyRolesForbiddenToGetDashboard)(
    "gets the user without dashboard url for role '%s'",
    async (agencyUserRole) => {
      const storedInclusionConnectedUser: InclusionConnectedUser = {
        ...john,
        agencyRights: [
          { agency: new AgencyDtoBuilder().build(), role: agencyUserRole },
        ],
      };
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        storedInclusionConnectedUser,
      ]);
      const inclusionConnectedUser = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(inclusionConnectedUser, storedInclusionConnectedUser);
    },
  );

  it("the dashboard url should not include the agency ids where role is 'toReview'", async () => {
    const agencyBuilder = new AgencyDtoBuilder();
    const agency1 = agencyBuilder
      .withId("1111")
      .withKind("pole-emploi")
      .build();
    const agency2 = agencyBuilder.withId("2222").build();
    const agency3 = agencyBuilder.withId("3333").build();
    const agency4 = agencyBuilder.withId("4444").build();

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        ...john,
        agencyRights: [
          { agency: agency1, role: "counsellor" },
          { agency: agency2, role: "validator" },
          { agency: agency3, role: "toReview" },
          { agency: agency4, role: "agencyOwner" },
        ],
      },
    ]);
    const url = await getInclusionConnectedUser.execute(
      undefined,
      inclusionConnectJwtPayload,
    );

    expectToEqual(url, {
      ...john,
      agencyRights: [
        { agency: agency1, role: "counsellor" },
        { agency: agency2, role: "validator" },
        { agency: agency3, role: "toReview" },
        { agency: agency4, role: "agencyOwner" },
      ],
      // dashboardUrl is coming from StubDashboardGateway
      agencyDashboardUrl: `http://stubAgencyDashboard/${agency1.id}_${agency2.id}_${agency4.id}`,
      erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${agency1.id}_${agency2.id}_${agency4.id}`,
    });
  });

  it("doesn't return errored convention dashboard url when user has no agency of kind PE", async () => {
    const agencyBuilder = new AgencyDtoBuilder();
    const agency1 = agencyBuilder.withId("1111").withKind("cci").build();

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        ...john,
        agencyRights: [{ agency: agency1, role: "counsellor" }],
      },
    ]);
    const url = await getInclusionConnectedUser.execute(
      undefined,
      inclusionConnectJwtPayload,
    );

    expect(url.erroredConventionsDashboardUrl).toBeUndefined();

    expectToEqual(url, {
      ...john,
      agencyRights: [{ agency: agency1, role: "counsellor" }],
      // dashboardUrl is coming from StubDashboardGateway
      agencyDashboardUrl: `http://stubAgencyDashboard/${agency1.id}`,
    });
  });

  describe("establishment representative dashboard", () => {
    it("retrieve establishment dashboard when IC user is establishement rep in at least one convention", async () => {
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        {
          ...john,
          agencyRights: [],
        },
      ]);
      const convention = new ConventionDtoBuilder()
        .withEstablishmentRepresentativeEmail(john.email)
        .build();
      uow.conventionRepository.setConventions([convention]);

      const result = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(
        result.establishmentRepresentativeDashboardUrl,
        `http://stubEstablishmentRepresentativeConventionsDashboardUrl/${
          john.id
        }/${timeGateway.now()}`,
      );
    });

    it("do not retrieve establishment dashboard when IC user is not establishement rep in any conventions", async () => {
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        {
          ...john,
          agencyRights: [],
        },
      ]);

      const result = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(result.establishmentRepresentativeDashboardUrl, undefined);
    });
  });
});
