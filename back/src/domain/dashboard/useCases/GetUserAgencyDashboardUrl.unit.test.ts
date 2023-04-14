import {
  AgencyDtoBuilder,
  allAgencyRoles,
  AuthenticatedUser,
  expectPromiseToFailWith,
  InclusionConnectJwtPayload,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { StubDashboardGateway } from "../../../adapters/secondary/dashboardGateway/StubDashboardGateway";
import { InMemoryInclusionConnectedUserRepository } from "../../../adapters/secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetUserAgencyDashboardUrl } from "./GetUserAgencyDashboardUrl";

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
  let getUserAgencyDashboardUrl: GetUserAgencyDashboardUrl;
  let uowPerformer: InMemoryUowPerformer;
  let inclusionConnectedUserRepository: InMemoryInclusionConnectedUserRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    inclusionConnectedUserRepository = uow.inclusionConnectedUserRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    getUserAgencyDashboardUrl = new GetUserAgencyDashboardUrl(
      uowPerformer,
      new StubDashboardGateway(),
      new CustomTimeGateway(),
    );
  });

  it("throws NotFoundError if the user is not found", async () => {
    await expectPromiseToFailWith(
      getUserAgencyDashboardUrl.execute(undefined, inclusionConnectJwtPayload),
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
      getUserAgencyDashboardUrl.execute(undefined, inclusionConnectJwtPayload),
      `No agency found for user with ID : ${userId}`,
    );
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWith(
      getUserAgencyDashboardUrl.execute(),
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
    "returns the dashboard url for the first agency for role '%s'",
    async (agencyUserRole) => {
      const agency = new AgencyDtoBuilder().build();
      inclusionConnectedUserRepository.setInclusionConnectedUsers([
        { ...john, agencyRights: [{ agency, role: agencyUserRole }] },
      ]);
      const url = await getUserAgencyDashboardUrl.execute(
        undefined,
        inclusionConnectJwtPayload,
      );
      expect(url).toBe(`http://stubAgencyDashboard/${agency.id}`); // coming from StubDashboardGateway
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
        getUserAgencyDashboardUrl.execute(
          undefined,
          inclusionConnectJwtPayload,
        ),
        `User with ID : ${userId} has not sufficient rights to access this dashboard`,
      );
    },
  );
});
