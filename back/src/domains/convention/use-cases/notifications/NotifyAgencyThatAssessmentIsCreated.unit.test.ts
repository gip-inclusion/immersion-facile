import {
  AgencyDtoBuilder,
  type AssessmentDto,
  type AssessmentStatus,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  type ExtractFromExisting,
  errors,
  expectPromiseToFailWithError,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  reasonableSchedule,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createAssessmentEntity } from "../../entities/AssessmentEntity";
import { NotifyAgencyThatAssessmentIsCreated } from "./NotifyAgencyThatAssessmentIsCreated";

const agency = new AgencyDtoBuilder().build();
const validator = new ConnectedUserBuilder()
  .withEmail("validator@email.com")
  .withId("validator")
  .buildUser();
const convention = new ConventionDtoBuilder()
  .withAgencyId(agency.id)
  .withDateStart(new Date("2025-01-01").toISOString())
  .withDateEnd(new Date("2025-01-15").toISOString())
  .withSchedule(reasonableSchedule)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const assessment: Extract<
  AssessmentDto,
  {
    status: ExtractFromExisting<AssessmentStatus, "PARTIALLY_COMPLETED">;
  }
> = {
  endedWithAJob: false,
  conventionId: convention.id,
  status: "PARTIALLY_COMPLETED",
  lastDayOfPresence: new Date("2025-01-07").toISOString(),
  numberOfMissedHours: 4,
  establishmentFeedback: "osef",
  establishmentAdvices: "osef",
};

describe("NotifyAgencyThatAssessmentIsCreated", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: NotifyAgencyThatAssessmentIsCreated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();

    timeGateway = new CustomTimeGateway();
    usecase = new NotifyAgencyThatAssessmentIsCreated(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("Throw when no convention were found", async () => {
    await expectPromiseToFailWithError(
      usecase.execute({ assessment }),
      errors.convention.notFound({ conventionId: assessment.conventionId }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Throw when no agency were found", async () => {
    await uow.conventionRepository.save(convention);

    await expectPromiseToFailWithError(
      usecase.execute({ assessment }),
      errors.agency.notFound({ agencyId: convention.agencyId }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Send an email to validators when beneficiary came", async () => {
    const validator2 = new ConnectedUserBuilder()
      .withEmail("validator2@email.com")
      .withId("validator2")
      .buildUser();
    uow.userRepository.users = [validator, validator2];
    await uow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    await uow.conventionRepository.save(convention);
    await uow.assessmentRepository.save(
      createAssessmentEntity(assessment, convention),
    );

    await usecase.execute({ assessment });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            businessName: convention.businessName,
            internshipKind: convention.internshipKind,
            conventionDateEnd: convention.dateEnd,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
            assessment,
            numberOfHoursMade: "45h",
            magicLink: fakeGenerateMagicLinkUrlFn({
              targetRoute: frontRoutes.assessmentDocument,
              id: convention.id,
              role: "validator",
              email: validator.email,
              now: timeGateway.now(),
              lifetime: "long",
            }),
          },
          recipients: [validator.email],
        },
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            businessName: convention.businessName,
            internshipKind: convention.internshipKind,
            conventionDateEnd: convention.dateEnd,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
            assessment,
            numberOfHoursMade: "45h",
            magicLink: fakeGenerateMagicLinkUrlFn({
              targetRoute: frontRoutes.assessmentDocument,
              id: convention.id,
              role: "validator",
              email: validator2.email,
              now: timeGateway.now(),
              lifetime: "long",
            }),
          },
          recipients: [validator2.email],
        },
      ],
    });
  });

  it("Send an email to validators when beneficiary did NOT come", async () => {
    const assessmentDidNotShow: AssessmentDto = {
      conventionId: convention.id,
      status: "DID_NOT_SHOW",
      endedWithAJob: false,
      establishmentFeedback: "osef feedback",
      establishmentAdvices: "osef conseil",
    };

    const validator2 = new ConnectedUserBuilder()
      .withEmail("validator2@email.com")
      .withId("validator2")
      .buildUser();
    uow.userRepository.users = [validator, validator2];
    await uow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    await uow.conventionRepository.save(convention);
    await uow.assessmentRepository.save(
      createAssessmentEntity(assessmentDidNotShow, convention),
    );

    await usecase.execute({ assessment: assessmentDidNotShow });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            businessName: convention.businessName,
            internshipKind: convention.internshipKind,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
          },
          recipients: [validator.email, validator2.email],
        },
      ],
    });
  });

  describe("When the convention is FT connected", () => {
    beforeEach(() => {
      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [
          {
            _entityName: "ConventionFranceTravailAdvisor",
            peExternalId: "pe-external-id",
            conventionId: convention.id,
            advisor: {
              firstName: "John",
              lastName: "Doe",
              type: "PLACEMENT",
              email: "john.doe@mail.fr",
            },
          },
        ],
      );
    });

    it("When beneficiary came, send an email to the advisor (and not to other agency users)", async () => {
      uow.userRepository.users = [validator];
      await uow.agencyRepository.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );
      await uow.conventionRepository.save(convention);
      await uow.assessmentRepository.save(
        createAssessmentEntity(assessment, convention),
      );
      const advisorEmail = "john.doe@mail.fr";
      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [
          {
            _entityName: "ConventionFranceTravailAdvisor",
            peExternalId: "pe-external-id",
            conventionId: convention.id,
            advisor: {
              firstName: "John",
              lastName: "Doe",
              type: "PLACEMENT",
              email: advisorEmail,
            },
          },
        ],
      );

      await usecase.execute({ assessment });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
            params: {
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              immersionObjective: convention.immersionObjective,
              conventionId: convention.id,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              businessName: convention.businessName,
              internshipKind: convention.internshipKind,
              conventionDateEnd: convention.dateEnd,
              immersionAppellationLabel:
                convention.immersionAppellation.appellationLabel,
              assessment,
              numberOfHoursMade: "45h",
              magicLink: fakeGenerateMagicLinkUrlFn({
                targetRoute: frontRoutes.assessmentDocument,
                id: convention.id,
                role: "validator",
                email: advisorEmail,
                now: timeGateway.now(),
                lifetime: "long",
              }),
            },
            recipients: [advisorEmail],
          },
        ],
      });
    });

    it("When beneficiary did NOT come, send an email to the advisor (and not to other agency users)", async () => {
      uow.userRepository.users = [validator];
      await uow.agencyRepository.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );
      await uow.conventionRepository.save(convention);
      const assessmentDidNotShow: AssessmentDto = {
        conventionId: convention.id,
        status: "DID_NOT_SHOW",
        endedWithAJob: false,
        establishmentFeedback: "osef feedback",
        establishmentAdvices: "osef conseil",
      };
      await uow.assessmentRepository.save(
        createAssessmentEntity(assessmentDidNotShow, convention),
      );
      const advisorEmail = "john.doe@mail.fr";
      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [
          {
            _entityName: "ConventionFranceTravailAdvisor",
            peExternalId: "pe-external-id",
            conventionId: convention.id,
            advisor: {
              firstName: "John",
              lastName: "Doe",
              type: "PLACEMENT",
              email: advisorEmail,
            },
          },
        ],
      );

      await usecase.execute({ assessment: assessmentDidNotShow });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
            params: {
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              immersionObjective: convention.immersionObjective,
              conventionId: convention.id,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              businessName: convention.businessName,
              internshipKind: convention.internshipKind,
              immersionAppellationLabel:
                convention.immersionAppellation.appellationLabel,
            },
            recipients: [advisorEmail],
          },
        ],
      });
    });
  });
});
