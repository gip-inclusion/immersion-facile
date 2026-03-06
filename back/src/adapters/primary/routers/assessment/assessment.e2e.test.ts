import {
  AgencyDtoBuilder,
  type AssessmentDto,
  type AssessmentRoutes,
  assessmentRoutes,
  authExpiredMessage,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  currentJwtVersions,
  displayRouteName,
  expectHttpResponseToEqual,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import type { GenerateConnectedUserJwt } from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { toAgencyWithRights } from "../../../../utils/agency";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("assessmentRoutes", () => {
  const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();
  const validator = new ConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.com")
    .buildUser();

  let httpClient: HttpClient<AssessmentRoutes>;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({ request, generateConnectedUserJwt, inMemoryUow } = await buildTestApp());

    httpClient = createSupertestSharedClient(assessmentRoutes, request);

    inMemoryUow.userRepository.users = [validator];
    inMemoryUow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [validator.id]: { roles: ["validator"], isNotifiedByEmail: false },
      }),
    ];
  });

  describe(`${displayRouteName(assessmentRoutes.getAssessmentsForAgencyUser)}`, () => {
    it("401 with bad token", async () => {
      const response = await httpClient.getAssessmentsForAgencyUser({
        headers: { authorization: "wrong-token" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { message: invalidTokenMessage, status: 401 },
      });
    });

    it("401 with expired token", async () => {
      const token = generateConnectedUserJwt(
        { userId: validator.id, version: currentJwtVersions.connectedUser },
        0,
      );

      const response = await httpClient.getAssessmentsForAgencyUser({
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { message: authExpiredMessage(), status: 401 },
      });
    });

    it("200 returns assessments for conventions belonging to user's agencies", async () => {
      const validToken = generateConnectedUserJwt({
        userId: validator.id,
        version: currentJwtVersions.connectedUser,
      });
      const convention = new ConventionDtoBuilder()
        .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();

      const assessment: AssessmentDto = {
        conventionId: convention.id,
        status: "COMPLETED",
        endedWithAJob: false,
        establishmentFeedback: "Ca s'est bien passé",
        establishmentAdvices: "mon conseil",
      };

      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.assessmentRepository.save({
        ...assessment,
        numberOfHoursActuallyMade: convention.schedule.totalHours,
        _entityName: "Assessment",
      });

      const response = await httpClient.getAssessmentsForAgencyUser({
        headers: { authorization: validToken },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: [assessment],
      });
    });
  });
});
