import {
  ConventionDtoBuilder,
  ConventionJwt,
  ConventionMagicLinkRoutes,
  conventionMagicLinkRoutes,
  createConventionMagicLinkPayload,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { CustomTimeGateway } from "../../../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";

const conventionId = "my-Convention-id";
const beneficiaryEmail = "joe@lebenef.fr";

describe("getConventionStatusDashboardUrl", () => {
  let httpClient: HttpClient<ConventionMagicLinkRoutes>;
  let jwt: ConventionJwt;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(async () => {
    const { request, generateConventionJwt, inMemoryUow, gateways } =
      await buildTestApp();

    uow = inMemoryUow;

    timeGateway = gateways.timeGateway;
    timeGateway.setNextDate(new Date());

    jwt = generateConventionJwt(
      createConventionMagicLinkPayload({
        id: conventionId,
        role: "beneficiary",
        email: beneficiaryEmail,
        now: gateways.timeGateway.now(),
      }),
    );

    httpClient = createSupertestSharedClient(
      conventionMagicLinkRoutes,
      request,
    );
  });

  it("fails if no token is provided", async () => {
    const response = await httpClient.getConventionStatusDashboard({
      headers: { authorization: "" },
    });

    expectHttpResponseToEqual(response, {
      status: 401,
      body: {
        error: "forbidden: unauthenticated",
      },
    });
  });

  it("gets the dashboard url if token is correct", async () => {
    const convention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("READY_TO_SIGN")
      .withBeneficiaryEmail(beneficiaryEmail)
      .build();

    uow.conventionRepository.setConventions([convention]);

    const response = await httpClient.getConventionStatusDashboard({
      headers: { authorization: jwt },
    });

    expectHttpResponseToEqual(response, {
      status: 200,
      body: {
        url: `http://stubConventionStatusDashboard/${
          convention.id
        }/${timeGateway.now()}`,
        name: "conventionStatus",
      },
    });
  });
});
