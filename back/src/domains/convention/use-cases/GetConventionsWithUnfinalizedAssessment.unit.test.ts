import { addDays, subDays, subMonths } from "date-fns";
import {
  AgencyDtoBuilder,
  ASSESSEMENT_SIGNATURE_RELEASE_DATE,
  type AssessmentDto,
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createAssessmentEntity } from "../entities/AssessmentEntity";
import { makeGetConventionsWithUnfinalizedAssessment } from "./GetConventionsWithUnfinalizedAssessment";

describe("GetConventionsWithUnfinalizedAssessment", () => {
  const now = new Date("2026-06-15T10:00:00Z");
  const threeMonthsAgo = subMonths(now, 3);
  const lessThanThreeMonthsAgo = addDays(threeMonthsAgo, 2);
  const moreThanThreeMonthsAgo = subDays(threeMonthsAgo, 2);
  const afterSignatureRelease = addDays(ASSESSEMENT_SIGNATURE_RELEASE_DATE, 10);
  const beforeSignatureRelease = subDays(ASSESSEMENT_SIGNATURE_RELEASE_DATE, 1);

  const agencyUserId = "agency-user-id-12345";
  const otherUserId = "other-user-id";

  const agency = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
      .withName("Test Agency")
      .withKind("pole-emploi")
      .build(),
    {
      [agencyUserId]: { isNotifiedByEmail: true, roles: ["validator"] },
    },
  );

  const currentUser = new ConnectedUserBuilder()
    .withId(agencyUserId)
    .withEmail("counsellor1@email.com")
    .withFirstName("John")
    .withLastName("Doe")
    .withAgencyRights([
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    ])
    .build();

  const otherAgency = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
      .withName("Other Agency")
      .withKind("pole-emploi")
      .build(),
    {
      [otherUserId]: { isNotifiedByEmail: true, roles: ["validator"] },
    },
  );

  const validatedConventionEnded5DaysAgo = new ConventionDtoBuilder()
    .withId("11111111-1111-4111-8111-111111111111")
    .withAgencyId(agency.id)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withDateStart(subDays(now, 30).toISOString())
    .withDateEnd(subDays(now, 5).toISOString())
    .build();

  const validatedConventionEndedMoreThanThreeMonthsAgo =
    new ConventionDtoBuilder()
      .withId("22222222-2222-4222-8222-222222222222")
      .withAgencyId(agency.id)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateEnd(moreThanThreeMonthsAgo.toISOString())
      .build();

  const validatedConventionEndedInTheFuture = new ConventionDtoBuilder()
    .withId("33333333-3333-4333-8333-333333333333")
    .withAgencyId(agency.id)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withDateEnd(addDays(now, 5).toISOString())
    .build();

  let uow: InMemoryUnitOfWork;
  let useCase: ReturnType<typeof makeGetConventionsWithUnfinalizedAssessment>;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway(now);
    const uowPerformer = new InMemoryUowPerformer(uow);
    useCase = makeGetConventionsWithUnfinalizedAssessment({
      uowPerformer,
      deps: { timeGateway },
    });

    uow.agencyRepository.agencies = [agency, otherAgency];
    uow.userRepository.users = [currentUser];
  });

  it("returns to-complete conventions whose dateEnd is within the last 3 months", async () => {
    uow.conventionRepository.setConventions([validatedConventionEnded5DaysAgo]);

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result, {
      data: [
        {
          id: validatedConventionEnded5DaysAgo.id,
          dateEnd: validatedConventionEnded5DaysAgo.dateEnd,
          beneficiary: {
            firstname:
              validatedConventionEnded5DaysAgo.signatories.beneficiary
                .firstName,
            lastname:
              validatedConventionEnded5DaysAgo.signatories.beneficiary.lastName,
          },
          assessment: null,
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 1,
      },
    });
  });

  it("excludes to-complete conventions ended more than 3 months ago", async () => {
    uow.conventionRepository.setConventions([
      validatedConventionEndedMoreThanThreeMonthsAgo,
    ]);

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result, {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 0,
      },
    });
  });

  it("excludes to-complete conventions whose dateEnd is in the future", async () => {
    uow.conventionRepository.setConventions([
      validatedConventionEndedInTheFuture,
    ]);

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result, {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 0,
      },
    });
  });

  it("returns to-sign conventions with assessment created within the last 3 months and after signature release", async () => {
    uow.conventionRepository.setConventions([
      validatedConventionEndedMoreThanThreeMonthsAgo,
    ]);

    const assessment = new AssessmentDtoBuilder()
      .withConventionId(validatedConventionEndedMoreThanThreeMonthsAgo.id)
      .withCreatedAt(lessThanThreeMonthsAgo.toISOString())
      .build();
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(
        assessment,
        validatedConventionEndedMoreThanThreeMonthsAgo,
      ),
    ];

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result, {
      data: [
        {
          id: validatedConventionEndedMoreThanThreeMonthsAgo.id,
          dateEnd: validatedConventionEndedMoreThanThreeMonthsAgo.dateEnd,
          beneficiary: {
            firstname:
              validatedConventionEndedMoreThanThreeMonthsAgo.signatories
                .beneficiary.firstName,
            lastname:
              validatedConventionEndedMoreThanThreeMonthsAgo.signatories
                .beneficiary.lastName,
          },
          assessment: {
            status: "COMPLETED",
            endedWithAJob: false,
            signedAt: null,
            createdAt: assessment.createdAt,
          },
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 1,
      },
    });
  });

  it("excludes to-sign conventions whose assessment was created more than 3 months ago", async () => {
    uow.conventionRepository.setConventions([
      validatedConventionEndedMoreThanThreeMonthsAgo,
    ]);

    const assessment = new AssessmentDtoBuilder()
      .withConventionId(validatedConventionEndedMoreThanThreeMonthsAgo.id)
      .withCreatedAt(moreThanThreeMonthsAgo.toISOString())
      .build();
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(
        assessment,
        validatedConventionEndedMoreThanThreeMonthsAgo,
      ),
    ];

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result, {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 0,
      },
    });
  });

  it("excludes assessments created before the signature release date (legacy era)", async () => {
    uow.conventionRepository.setConventions([validatedConventionEnded5DaysAgo]);

    const assessment = new AssessmentDtoBuilder()
      .withConventionId(validatedConventionEnded5DaysAgo.id)
      .withCreatedAt(beforeSignatureRelease.toISOString())
      .build();
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(assessment, validatedConventionEnded5DaysAgo),
    ];

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result.data, []);
  });

  it("excludes finalized assessments (already signed)", async () => {
    uow.conventionRepository.setConventions([validatedConventionEnded5DaysAgo]);

    const assessment = new AssessmentDtoBuilder()
      .withConventionId(validatedConventionEnded5DaysAgo.id)
      .withCreatedAt(afterSignatureRelease.toISOString())
      .withBeneficiarySignature({
        beneficiaryAgreement: true,
        beneficiaryFeedback: "ok",
        signedAt: addDays(afterSignatureRelease, 1).toISOString(),
      })
      .build();
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(assessment, validatedConventionEnded5DaysAgo),
    ];

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result.data, []);
  });

  it("excludes DID_NOT_SHOW assessments", async () => {
    uow.conventionRepository.setConventions([validatedConventionEnded5DaysAgo]);

    const assessment: AssessmentDto = {
      conventionId: validatedConventionEnded5DaysAgo.id,
      status: "DID_NOT_SHOW",
      endedWithAJob: false,
      beneficiaryAgreement: null,
      beneficiaryFeedback: null,
      establishmentFeedback: "no-show",
      establishmentAdvices: "n/a",
      signedAt: null,
      createdAt: lessThanThreeMonthsAgo.toISOString(),
    };
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(assessment, validatedConventionEnded5DaysAgo),
    ];

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result.data, []);
  });

  it("excludes conventions with status other than ACCEPTED_BY_VALIDATOR", async () => {
    const conventionReadyToSign = new ConventionDtoBuilder()
      .withId("99999999-9999-4999-8999-999999999999")
      .withAgencyId(agency.id)
      .withStatus("READY_TO_SIGN")
      .withDateEnd(subDays(now, 10).toISOString())
      .build();
    uow.conventionRepository.setConventions([conventionReadyToSign]);

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result, {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 0,
      },
    });
  });

  it("excludes conventions of agencies the current user has no role on", async () => {
    const conventionOnOtherAgency = new ConventionDtoBuilder()
      .withId("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1")
      .withAgencyId(otherAgency.id)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateStart(subDays(now, 40).toISOString())
      .withDateEnd(subDays(now, 10).toISOString())
      .build();
    uow.conventionRepository.setConventions([conventionOnOtherAgency]);

    const result = await useCase.execute({ page: 1, perPage: 10 }, currentUser);

    expectToEqual(result, {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 0,
      },
    });
  });

  it("paginates results sorted by dateEnd ASC", async () => {
    const conventionEarliest = new ConventionDtoBuilder()
      .withId("11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
      .withAgencyId(agency.id)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateStart(subDays(now, 60).toISOString())
      .withDateEnd(subDays(now, 30).toISOString())
      .build();

    const conventionMiddle = new ConventionDtoBuilder()
      .withId("22222222-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
      .withAgencyId(agency.id)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateStart(subDays(now, 45).toISOString())
      .withDateEnd(subDays(now, 15).toISOString())
      .build();

    const conventionLatest = new ConventionDtoBuilder()
      .withId("33333333-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
      .withAgencyId(agency.id)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateStart(subDays(now, 25).toISOString())
      .withDateEnd(subDays(now, 5).toISOString())
      .build();
    uow.conventionRepository.setConventions([
      conventionEarliest,
      conventionMiddle,
      conventionLatest,
    ]);

    const page1 = await useCase.execute({ page: 1, perPage: 2 }, currentUser);
    const page2 = await useCase.execute({ page: 2, perPage: 2 }, currentUser);

    expectToEqual(page1, {
      data: [
        {
          id: conventionEarliest.id,
          dateEnd: conventionEarliest.dateEnd,
          beneficiary: {
            firstname: conventionEarliest.signatories.beneficiary.firstName,
            lastname: conventionEarliest.signatories.beneficiary.lastName,
          },
          assessment: null,
        },
        {
          id: conventionMiddle.id,
          dateEnd: conventionMiddle.dateEnd,
          beneficiary: {
            firstname: conventionMiddle.signatories.beneficiary.firstName,
            lastname: conventionMiddle.signatories.beneficiary.lastName,
          },
          assessment: null,
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 2,
        numberPerPage: 2,
        totalRecords: 3,
      },
    });

    expectToEqual(page2, {
      data: [
        {
          id: conventionLatest.id,
          dateEnd: conventionLatest.dateEnd,
          beneficiary: {
            firstname: conventionLatest.signatories.beneficiary.firstName,
            lastname: conventionLatest.signatories.beneficiary.lastName,
          },
          assessment: null,
        },
      ],
      pagination: {
        currentPage: 2,
        totalPages: 2,
        numberPerPage: 2,
        totalRecords: 3,
      },
    });
  });
});
