import { subDays } from "date-fns";
import {
  AgencyDtoBuilder,
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createAssessmentEntity } from "../entities/AssessmentEntity";
import { makeGetConventionsWithUnfinalizedAssessment } from "./GetConventionsWithUnfinalizedAssessment";

describe("GetConventionsWithUnfinalizedAssessment", () => {
  const now = new Date();

  const agency = new AgencyDtoBuilder()
    .withId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    .withName("Test Agency")
    .withKind("pole-emploi")
    .build();

  const validatedConvention = new ConventionDtoBuilder()
    .withAgencyId(agency.id)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .build();
  const assessment = new AssessmentDtoBuilder()
    .withConventionId(validatedConvention.id)
    .withCreatedAt(subDays(now, 10).toISOString())
    .build();

  let uow: InMemoryUnitOfWork;
  let useCase: ReturnType<typeof makeGetConventionsWithUnfinalizedAssessment>;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway(now);
    useCase = makeGetConventionsWithUnfinalizedAssessment({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: { timeGateway },
    });

    uow.conventionRepository.setConventions([validatedConvention]);
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(assessment, validatedConvention),
    ];
  });

  it("return paginated conventions with unfinalized assessment related to user agency rights", async () => {
    const currentUserWithValidAgencyRight = new ConnectedUserBuilder()
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    expectToEqual(
      await useCase.execute(
        { page: 1, perPage: 10 },
        currentUserWithValidAgencyRight,
      ),
      {
        data: [
          {
            assessment: {
              createdAt: assessment.createdAt,
              endedWithAJob: assessment.endedWithAJob,
              signedAt: assessment.signedAt,
              status: assessment.status,
            },
            beneficiary: {
              firstname: validatedConvention.signatories.beneficiary.firstName,
              lastname: validatedConvention.signatories.beneficiary.lastName,
            },
            dateEnd: validatedConvention.dateEnd,
            id: validatedConvention.id,
          },
        ],
        pagination: {
          currentPage: 1,
          numberPerPage: 10,
          totalPages: 1,
          totalRecords: 1,
        },
      },
    );
  });

  it("throws when user have not the right agency role", async () => {
    const currentUserWithToReviewAgencyRight = new ConnectedUserBuilder()
      .withAgencyRights([
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
          roles: ["to-review"],
          isNotifiedByEmail: true,
        },
      ])
      .build();

    await expectPromiseToFailWithError(
      useCase.execute(
        { page: 1, perPage: 10 },
        currentUserWithToReviewAgencyRight,
      ),
      errors.agencies.noAgencyRights(currentUserWithToReviewAgencyRight.id),
    );
  });

  it("throws when user have no agency rights", async () => {
    const currentUserWithToReviewAgencyRight = new ConnectedUserBuilder()
      .withAgencyRights([])
      .build();

    await expectPromiseToFailWithError(
      useCase.execute(
        { page: 1, perPage: 10 },
        currentUserWithToReviewAgencyRight,
      ),
      errors.agencies.noAgencyRights(currentUserWithToReviewAgencyRight.id),
    );
  });
});
