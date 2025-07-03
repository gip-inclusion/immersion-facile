import {
  AgencyDtoBuilder,
  type AssessmentDto,
  allRoles,
  ConnectedUserBuilder,
  type ConventionDomainPayload,
  ConventionDtoBuilder,
  type ConventionJwtPayload,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  type LegacyAssessmentDto,
  type Role,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeHashByRolesForTest } from "../../../utils/emailHash";
import { makeEmailHash } from "../../../utils/jwt";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import type { AssessmentEntity } from "../entities/AssessmentEntity";
import {
  type GetAssessmentByConventionId,
  makeGetAssessmentByConventionId,
} from "./GetAssessmentByConventionId";

describe("GetAssessmentByConventionId", () => {
  const agency = new AgencyDtoBuilder().build();
  const counsellor = new ConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@email.com")
    .buildUser();
  const validator = new ConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@email.com")
    .buildUser();
  const userWithoutRoleOnConvention = new ConnectedUserBuilder()
    .withId("userWithoutRoleOnConvention")
    .withEmail("userWithoutRoleOnConvention@email.com")
    .buildUser();
  const backOfficeAdmin = new ConnectedUserBuilder()
    .withId("backOfficeAdmin")
    .withEmail("backOfficeAdmin@email.com")
    .withIsAdmin(true)
    .buildUser();
  const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();
  const establishmentTutorPayload: ConventionDomainPayload = {
    applicationId: convention.id,
    role: "establishment-tutor",
    emailHash: makeEmailHash(convention.establishmentTutor.email),
  };
  const assessment: AssessmentDto = {
    conventionId: convention.id,
    status: "COMPLETED",
    endedWithAJob: false,
    establishmentAdvices: "my advices",
    establishmentFeedback: "my feedback",
  };
  const [passingRoles, failingRoles] = splitCasesBetweenPassingAndFailing(
    allRoles,
    [
      "establishment-tutor",
      "establishment-representative",
      "validator",
      "counsellor",
      "beneficiary",
    ],
  );

  let getAssessment: GetAssessmentByConventionId;
  let uow: InMemoryUnitOfWork;

  beforeEach(async () => {
    uow = createInMemoryUow();
    getAssessment = makeGetAssessmentByConventionId({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
    uow.conventionRepository.setConventions([convention]);
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
    uow.assessmentRepository.setAssessments([
      {
        _entityName: "Assessment",
        numberOfHoursActuallyMade: convention.schedule.totalHours,
        ...assessment,
      },
    ]);
  });

  describe("Wrong paths", () => {
    it("throws forbidden if no magicLink payload is provided", async () => {
      await expectPromiseToFailWithError(
        getAssessment.execute({ conventionId: convention.id }, undefined),
        errors.user.noJwtProvided(),
      );
    });

    it("throws forbidden if magicLink payload has a different applicationId linked", async () => {
      await expectPromiseToFailWithError(
        getAssessment.execute({ conventionId: convention.id }, {
          applicationId: "otherId",
          role: "establishment-tutor",
        } as ConventionJwtPayload),
        errors.assessment.conventionIdMismatch(),
      );
    });

    it.each(failingRoles)(
      "throws forbidden if magicLink role is '%s'",
      async (role) => {
        await expectPromiseToFailWithError(
          getAssessment.execute(
            { conventionId: convention.id },
            {
              applicationId: convention.id,
              emailHash: makeHashByRolesForTest(
                convention,
                counsellor,
                validator,
              )[role],
              role,
            },
          ),
          errors.assessment.forbidden("GetAssessment"),
        );
      },
    );

    it("throws forbidden if user doesnt have allowed assessment role on convention", async () => {
      uow.conventionRepository.setConventions([convention]);

      await expectPromiseToFailWithError(
        getAssessment.execute(
          { conventionId: convention.id },
          {
            userId: userWithoutRoleOnConvention.id,
          },
        ),
        errors.assessment.forbidden("GetAssessment"),
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
          getAssessment.execute(
            { conventionId: convention.id },
            {
              ...establishmentTutorPayload,
              emailHash: makeHashByRolesForTest(
                convention,
                counsellor,
                validator,
              )[role],
              role,
            },
          ),
          errors.assessment.forbidden("GetAssessment"),
        );
      },
    );

    it("throw not found error when no assessment exist", async () => {
      uow.assessmentRepository.setAssessments([]);

      await expectPromiseToFailWithError(
        getAssessment.execute(
          {
            conventionId: convention.id,
          },
          establishmentTutorPayload,
        ),
        errors.assessment.notFound(convention.id),
      );
    });
  });

  describe("Right paths", () => {
    it.each(passingRoles)(
      "get existing assessment with magic link role '%s'",
      async (role) => {
        expectToEqual(
          await getAssessment.execute(
            {
              conventionId: convention.id,
            },
            {
              ...establishmentTutorPayload,
              role,
              emailHash: makeHashByRolesForTest(
                convention,
                counsellor,
                validator,
              )[role],
            },
          ),
          assessment,
        );
      },
    );

    it("get existing assessment if user is validator", async () => {
      uow.conventionRepository.setConventions([convention]);

      expectToEqual(
        await getAssessment.execute(
          { conventionId: convention.id },
          {
            userId: validator.id,
          },
        ),
        assessment,
      );
    });

    it("get existing assessment if user is counsellor", async () => {
      uow.conventionRepository.setConventions([convention]);

      expectToEqual(
        await getAssessment.execute(
          { conventionId: convention.id },
          {
            userId: counsellor.id,
          },
        ),
        assessment,
      );
    });

    it("get existing assessment if user is back-office admin", async () => {
      uow.conventionRepository.setConventions([convention]);

      expectToEqual(
        await getAssessment.execute(
          { conventionId: convention.id },
          {
            userId: backOfficeAdmin.id,
          },
        ),
        assessment,
      );
    });

    it("can also get an assessment with legacy format", async () => {
      const legacyAssessment: LegacyAssessmentDto = {
        status: "FINISHED",
        conventionId: convention.id,
        establishmentFeedback: "this is my feedback",
      };
      const assessmentEntity: AssessmentEntity = {
        _entityName: "Assessment",
        ...legacyAssessment,
        numberOfHoursActuallyMade: 0,
      };
      uow.assessmentRepository.setAssessments([assessmentEntity]);

      const assessment = await getAssessment.execute(
        { conventionId: convention.id },
        {
          role: "validator",
          applicationId: convention.id,
          emailHash: makeHashByRolesForTest(convention, counsellor, validator)
            .validator,
        },
      );

      expectToEqual(assessment, legacyAssessment);
    });
  });
});
