import {
  AgencyDtoBuilder,
  expectPromiseToFailWith,
  InclusionConnectJwtPayload,
} from "shared";
import { AuthenticatedUser } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { StubDashboardGateway } from "../../../adapters/secondary/dashboardGateway/StubDashboardGateway";
import { InMemoryInclusionConnectedUserQueries } from "../../../adapters/secondary/InMemoryInclusionConnectedUserQueries";
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
  let inclusionConnectedUserQueries: InMemoryInclusionConnectedUserQueries;

  beforeEach(() => {
    const uow = createInMemoryUow();
    inclusionConnectedUserQueries = uow.inclusionConnectedUserQueries;
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

  it("throws NotFoundError if the user has no agencies attached", async () => {
    inclusionConnectedUserQueries.setInclusionConnectedUsers([
      {
        ...john,
        agencies: [],
      },
    ]);
    await expectPromiseToFailWith(
      getUserAgencyDashboardUrl.execute(undefined, inclusionConnectJwtPayload),
      `No agencies found for user with ID : ${userId}`,
    );
  });

  it("returns the dashboard url for the first agency of the user", async () => {
    const agency = new AgencyDtoBuilder().build();
    inclusionConnectedUserQueries.setInclusionConnectedUsers([
      { ...john, agencies: [agency] },
    ]);
    const url = await getUserAgencyDashboardUrl.execute(
      undefined,
      inclusionConnectJwtPayload,
    );
    expect(url).toBe(`http://stubAgencyDashboard/${agency.id}`); // coming from StubDashboardGateway
  });
});
