import {
  AgencyDtoBuilder,
  allAgencyRoles,
  AuthenticatedUser,
  expectPromiseToFailWith,
  expectToEqual,
  InclusionConnectJwtPayload,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { StubDashboardGateway } from "../../../adapters/secondary/dashboardGateway/StubDashboardGateway";
import { InMemoryInclusionConnectedUserRepository } from "../../../adapters/secondary/InMemoryInclusionConnectedUserRepository";
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
  let inclusionConnectedUserRepository: InMemoryInclusionConnectedUserRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    inclusionConnectedUserRepository = uow.inclusionConnectedUserRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    getInclusionConnectedUser = new GetInclusionConnectedUser(
      uowPerformer,
      new StubDashboardGateway(),
      new CustomTimeGateway(),
    );
  });

  it("throws NotFoundError if the user is not found", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute(undefined, inclusionConnectJwtPayload),
      `No user found with provided ID : ${userId}`,
    );
  });

  it("throws NotFoundError if the user has no agency attached", async () => {
    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        ...john,
        agencyRights: [],
      },
    ]);
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute(undefined, inclusionConnectJwtPayload),
      `User with ID : ${userId} has no agencies with enough privileges to access a corresponding dashboard`,
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
      inclusionConnectedUserRepository.setInclusionConnectedUsers([
        { ...john, agencyRights: [{ agency, role: agencyUserRole }] },
      ]);
      const url = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(url, {
        ...john,
        agencyRights: [{ agency, role: agencyUserRole }],
        dashboardUrl: `http://stubAgencyDashboard/${agency.id}`,
      }); // coming from StubDashboardGateway
    },
  );

  it.each(agencyRolesForbiddenToGetDashboard)(
    "fails to get the dashboard url for role '%s'",
    async (agencyUserRole) => {
      inclusionConnectedUserRepository.setInclusionConnectedUsers([
        {
          ...john,
          agencyRights: [
            { agency: new AgencyDtoBuilder().build(), role: agencyUserRole },
          ],
        },
      ]);

      await expectPromiseToFailWith(
        getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        ),
        `User with ID : ${userId} has no agencies with enough privileges to access a corresponding dashboard`,
      );
    },
  );

  it("the dashboard url should not include the agency ids where role is 'toReview'", async () => {
    const agencyBuilder = new AgencyDtoBuilder();
    const agency1 = agencyBuilder.withId("1111").build();
    const agency2 = agencyBuilder.withId("2222").build();
    const agency3 = agencyBuilder.withId("3333").build();
    const agency4 = agencyBuilder.withId("4444").build();

    inclusionConnectedUserRepository.setInclusionConnectedUsers([
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
      dashboardUrl: `http://stubAgencyDashboard/${agency1.id}_${agency2.id}_${agency4.id}`,
    });
  });
});
