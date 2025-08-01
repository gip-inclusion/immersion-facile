import {
  AgencyDtoBuilder,
  type AssessmentDto,
  allRoles,
  ConnectedUserBuilder,
  type ConventionDomainPayload,
  ConventionDtoBuilder,
  conventionStatuses,
  errors,
  expectArraysToEqual,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  ForbiddenError,
  type Role,
  reasonableSchedule,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeHashByRolesForTest } from "../../../utils/emailHash";
import { makeEmailHash } from "../../../utils/jwt";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { acceptedConventionStatusesForAssessment } from "../entities/AssessmentEntity";
import {
  type CreateAssessment,
  makeCreateAssessment,
} from "./CreateAssessment";

describe("CreateAssessment", () => {
  const agency = new AgencyDtoBuilder().build();
  const counsellor = new ConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.com")
    .buildUser();
  const validator = new ConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.com")
    .buildUser();

  const validatedConvention = new ConventionDtoBuilder()
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(agency.id)
    .build();
  const userWithoutRoleOnConvention = new ConnectedUserBuilder()
    .withId("userWithoutRoleOnConvention")
    .withEmail("userWithoutRoleOnConvention@email.com")
    .buildUser();
  const backOfficeAdmin = new ConnectedUserBuilder()
    .withId("backOfficeAdmin")
    .withEmail("backOfficeAdmin@email.com")
    .withIsAdmin(true)
    .buildUser();
  const assessment: AssessmentDto = {
    conventionId: validatedConvention.id,
    status: "COMPLETED",
    endedWithAJob: false,
    establishmentFeedback: "Ca c'est bien passé",
    establishmentAdvices: "mon conseil",
  };

  const tutorPayload: ConventionDomainPayload = {
    applicationId: validatedConvention.id,
    role: "establishment-tutor",
    emailHash: makeEmailHash(validatedConvention.establishmentTutor.email),
  };

  const [passingStatuses, failingStatuses] = splitCasesBetweenPassingAndFailing(
    conventionStatuses,
    acceptedConventionStatusesForAssessment,
  );

  const [passingRoles, failingRoles] = splitCasesBetweenPassingAndFailing(
    allRoles,
    ["establishment-tutor", "validator", "counsellor"],
  );

  const passingStatusAndRoles = passingStatuses.flatMap((status) =>
    passingRoles.map((role) => ({ status, role })),
  );

  let createAssessment: CreateAssessment;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    createAssessment = makeCreateAssessment({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          timeGateway: new CustomTimeGateway(),
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });

    uow.conventionRepository.setConventions([validatedConvention]);
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [counsellor.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    ];
    uow.userRepository.users = [
      counsellor,
      validator,
      userWithoutRoleOnConvention,
      backOfficeAdmin,
    ];
  });

  describe("wrong path", () => {
    it("throws forbidden if no magicLink payload is provided", async () => {
      await expectPromiseToFailWithError(
        createAssessment.execute(assessment, undefined),
        new ForbiddenError("No magic link provided"),
      );
    });

    it("throws forbidden if magicLink payload has a different applicationId linked", async () => {
      await expectPromiseToFailWithError(
        createAssessment.execute(assessment, {
          ...tutorPayload,
          applicationId: "otherId",
        }),
        errors.assessment.conventionIdMismatch(),
      );
    });

    it("throws not found if provided conventionId does not match any in DB", async () => {
      const notFoundId = "not-found-id";
      await expectPromiseToFailWithError(
        createAssessment.execute(
          { ...assessment, conventionId: notFoundId },
          { ...tutorPayload, applicationId: notFoundId },
        ),
        errors.convention.notFound({ conventionId: notFoundId }),
      );
    });

    it("throws ConflictError if the assessment already exists for the Convention", async () => {
      uow.assessmentRepository.setAssessments([
        {
          ...assessment,
          _entityName: "Assessment",
          numberOfHoursActuallyMade: validatedConvention.schedule.totalHours,
        },
      ]);
      await expectPromiseToFailWithError(
        createAssessment.execute(assessment, tutorPayload),
        errors.assessment.alreadyExist(assessment.conventionId),
      );
    });

    it.each(failingStatuses.map((status) => ({ status })))(
      "throws bad request if the Convention status is '$status'",
      async ({ status }) => {
        const convention = new ConventionDtoBuilder(validatedConvention)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          createAssessment.execute(assessment, tutorPayload),
          errors.assessment.badStatus(status),
        );
      },
    );

    it.each(failingRoles)(
      "throws forbidden if the jwt role is '%s'",
      async (role) => {
        await expectPromiseToFailWithError(
          createAssessment.execute(assessment, {
            applicationId: validatedConvention.id,
            emailHash: makeHashByRolesForTest(
              validatedConvention,
              counsellor,
              validator,
            )[role],
            role,
          }),
          errors.assessment.forbidden("CreateAssessment"),
        );
      },
    );

    it("throws forbidden if user doesnt have allowed assessment role on convention", async () => {
      await expectPromiseToFailWithError(
        createAssessment.execute(
          assessment,

          {
            userId: userWithoutRoleOnConvention.id,
          },
        ),
        errors.assessment.forbidden("CreateAssessment"),
      );
    });

    it.each(["counsellor", "validator"] satisfies Role[])(
      "throw forbidden if the jwt role is '%s' the user is not notified on agency rights",
      async (role) => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [counsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
            [validator.id]: {
              isNotifiedByEmail: false,
              roles: ["validator"],
            },
          }),
        ];
        await expectPromiseToFailWithError(
          createAssessment.execute(assessment, {
            ...tutorPayload,
            emailHash: makeHashByRolesForTest(
              validatedConvention,
              counsellor,
              validator,
            )[role],
            role,
          }),
          errors.assessment.forbidden("CreateAssessment"),
        );
      },
    );
  });

  describe("Right paths", () => {
    it.each(passingStatusAndRoles)(
      "should save the Assessment if Convention has status $status and role with email hash in payload is $role",
      async ({ status, role }) => {
        const convention = new ConventionDtoBuilder(validatedConvention)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions([convention]);

        await createAssessment.execute(assessment, {
          ...tutorPayload,
          role,
          emailHash: makeHashByRolesForTest(convention, counsellor, validator)[
            role
          ],
        });

        expectArraysToEqual(uow.assessmentRepository.assessments, [
          {
            ...assessment,
            _entityName: "Assessment",
            numberOfHoursActuallyMade: validatedConvention.schedule.totalHours,
          },
        ]);
      },
    );

    it("should save the Assessment when user is validator on convention", async () => {
      uow.conventionRepository.setConventions([validatedConvention]);

      await createAssessment.execute(assessment, {
        userId: validator.id,
      });

      expectArraysToEqual(uow.assessmentRepository.assessments, [
        {
          ...assessment,
          _entityName: "Assessment",
          numberOfHoursActuallyMade: validatedConvention.schedule.totalHours,
        },
      ]);
    });

    it("should save the Assessment when user is counsellor on convention", async () => {
      uow.conventionRepository.setConventions([validatedConvention]);

      await createAssessment.execute(assessment, {
        userId: counsellor.id,
      });

      expectArraysToEqual(uow.assessmentRepository.assessments, [
        {
          ...assessment,
          _entityName: "Assessment",
          numberOfHoursActuallyMade: validatedConvention.schedule.totalHours,
        },
      ]);
    });

    it("should create an assessment with correct duration when partially completed", async () => {
      const convention = new ConventionDtoBuilder(validatedConvention)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateStart(new Date("2025-01-20").toISOString())
        .withDateEnd(new Date("2025-01-24").toISOString())
        .withSchedule(reasonableSchedule)
        .build();

      const partiallyCompletedAssessment: AssessmentDto = {
        conventionId: validatedConvention.id,
        status: "PARTIALLY_COMPLETED",
        lastDayOfPresence: new Date("2025-01-23").toISOString(),
        numberOfMissedHours: 2.5,
        endedWithAJob: false,
        establishmentFeedback: "Ca c'est bien passé",
        establishmentAdvices: "mon conseil",
      };

      uow.conventionRepository.setConventions([convention]);

      await createAssessment.execute(partiallyCompletedAssessment, {
        ...tutorPayload,
        role: "establishment-tutor",
        emailHash: makeHashByRolesForTest(convention, counsellor, validator)[
          "establishment-tutor"
        ],
      });

      expectArraysToEqual(uow.assessmentRepository.assessments, [
        {
          ...partiallyCompletedAssessment,
          _entityName: "Assessment",
          numberOfHoursActuallyMade: 25.5, // 4 days * 7 hours - 2.5 missed hours
        },
      ]);
    });

    it("should dispatch an AssessmentCreated event", async () => {
      await createAssessment.execute(assessment, tutorPayload);

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        {
          topic: "AssessmentCreated",
          payload: {
            convention: validatedConvention,
            assessment,
            triggeredBy: {
              kind: "convention-magic-link",
              role: tutorPayload.role,
            },
          },
        },
      ]);
    });
  });
});
