import { subMonths } from "date-fns";
import subDays from "date-fns/subDays";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type ConnectedUser,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type DateString,
  expectObjectInArrayToMatch,
  getFormattedFirstnameAndLastname,
  type Notification,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import type { AssessmentEntity } from "../../convention/entities/AssessmentEntity";
import {
  makeSaveNotificationAndRelatedEvent,
  type SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type AssessmentReminder,
  makeAssessmentReminder,
} from "./AssessmentReminder";

describe("AssessmentReminder", () => {
  let uow: InMemoryUnitOfWork;
  let assessmentReminder: AssessmentReminder;
  let timeGateway: TimeGateway;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let config: AppConfig;
  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    const uowPerformer = new InMemoryUowPerformer(uow);
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      new UuidV4Generator(),
      timeGateway,
    );
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    config = new AppConfigBuilder().build();
    assessmentReminder = makeAssessmentReminder({
      uowPerformer,
      deps: {
        outOfTrx: {
          assessmentRepository: uow.assessmentRepository,
          notificationRepository: uow.notificationRepository,
        },
        timeGateway,
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        shortLinkIdGeneratorGateway,
        config,
      },
    });
  });

  describe("reminders are not sent", () => {
    let now: Date;
    let agency: AgencyDto;
    let convention: ConventionDto;

    beforeEach(async () => {
      now = timeGateway.now();
      agency = new AgencyDtoBuilder().build();
      convention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(now, 3).toISOString())
        .withAgencyId(agency.id)
        .build();

      await uow.conventionRepository.save(convention);
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
    });

    it("when tutor receive initial assessment email long ago", async () => {
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention,
          createdAt: subMonths(now, 1).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);

      const { numberOfConventionsReminded } = await assessmentReminder.execute({
        mode: "10daysAfterInitialAssessmentEmail",
      });

      expect(numberOfConventionsReminded).toBe(0);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
      ]);
      expectObjectInArrayToMatch(uow.outboxRepository.events, []);
    });

    it("when tutor already filled the assessment", async () => {
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention,
          createdAt: subDays(now, 3).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);
      const assessment: AssessmentEntity = {
        conventionId: convention.id,
        status: "COMPLETED",
        endedWithAJob: false,
        establishmentFeedback: "Ca s'est bien passé",
        establishmentAdvices: "mon conseil",
        numberOfHoursActuallyMade: 404,
        _entityName: "Assessment",
      };
      await uow.assessmentRepository.save(assessment);

      const { numberOfConventionsReminded } = await assessmentReminder.execute({
        mode: "3daysAfterInitialAssessmentEmail",
      });

      expect(numberOfConventionsReminded).toBe(0);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
      ]);
      expectObjectInArrayToMatch(uow.outboxRepository.events, []);
    });
  });

  describe("reminders are sent", () => {
    let now: Date;
    let agency: AgencyDto;
    let convention: ConventionDto;
    let validator: ConnectedUser;

    beforeEach(async () => {
      now = timeGateway.now();
      agency = new AgencyDtoBuilder().build();
      convention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(now, 3).toISOString())
        .withAgencyId(agency.id)
        .build();

      await uow.conventionRepository.save(convention);
      validator = new ConnectedUserBuilder()
        .withId("validator1")
        .withEmail("validator@mail.com")
        .build();
      uow.userRepository.save(validator);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      ];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([
        "short-link-id-1",
        "short-link-id-2",
      ]);
    });

    it("send first assessment reminder to tutor and validator", async () => {
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention,
          createdAt: subDays(now, 3).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);

      const { numberOfConventionsReminded } = await assessmentReminder.execute({
        mode: "3daysAfterInitialAssessmentEmail",
      });

      expect(numberOfConventionsReminded).toBe(1);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
        {
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              establishmentTutorFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.establishmentTutor.firstName,
              }),
              establishmentTutorLastName: getFormattedFirstnameAndLastname({
                lastname: convention.establishmentTutor.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
            },
            recipients: [convention.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        },
        {
          templatedContent: {
            kind: "ASSESSMENT_AGENCY_NOTIFICATION",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-2`,
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              businessName: convention.businessName,
              agencyLogoUrl: agency.logoUrl ?? undefined,
              tutorEmail: convention.establishmentTutor.email,
            },
            recipients: [validator.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        },
      ]);
      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
        { topic: "NotificationAdded" },
      ]);
    });

    it("send second assessment reminder to tutor and validator", async () => {
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention,
          createdAt: subDays(now, 10).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);

      const { numberOfConventionsReminded } = await assessmentReminder.execute({
        mode: "10daysAfterInitialAssessmentEmail",
      });

      expect(numberOfConventionsReminded).toBe(1);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
        {
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              establishmentTutorFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.establishmentTutor.firstName,
              }),
              establishmentTutorLastName: getFormattedFirstnameAndLastname({
                lastname: convention.establishmentTutor.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
            },
            recipients: [convention.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        },
        {
          templatedContent: {
            kind: "ASSESSMENT_AGENCY_NOTIFICATION",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-2`,
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              businessName: convention.businessName,
              agencyLogoUrl: agency.logoUrl ?? undefined,
              tutorEmail: convention.establishmentTutor.email,
            },
            recipients: [validator.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        },
      ]);
      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
        { topic: "NotificationAdded" },
      ]);
    });

    it("when there is an advisor, send assessment reminder to tutor and advisor", async () => {
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
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention,
          createdAt: subDays(now, 3).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);

      const { numberOfConventionsReminded } = await assessmentReminder.execute({
        mode: "3daysAfterInitialAssessmentEmail",
      });

      expect(numberOfConventionsReminded).toBe(1);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
        {
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              establishmentTutorFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.establishmentTutor.firstName,
              }),
              establishmentTutorLastName: getFormattedFirstnameAndLastname({
                lastname: convention.establishmentTutor.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
            },
            recipients: [convention.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        },
        {
          templatedContent: {
            kind: "ASSESSMENT_AGENCY_NOTIFICATION",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-2`,
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              businessName: convention.businessName,
              agencyLogoUrl: agency.logoUrl ?? undefined,
              tutorEmail: convention.establishmentTutor.email,
            },
            recipients: [advisorEmail],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        },
      ]);
      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
        { topic: "NotificationAdded" },
      ]);
    });

    it("when internshipKind is mini-stage-cci, only send reminder to tutor and not agency", async () => {
      const miniStageConvention = new ConventionDtoBuilder()
        .withId("77777777-6666-4777-7777-777777777777")
        .withInternshipKind("mini-stage-cci")
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(subMonths(now, 3).toISOString())
        .withAgencyId(agency.id)
        .build();
      await uow.conventionRepository.save(miniStageConvention);
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention: miniStageConvention,
          createdAt: subDays(now, 3).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);

      const { numberOfConventionsReminded } = await assessmentReminder.execute({
        mode: "3daysAfterInitialAssessmentEmail",
      });

      expect(numberOfConventionsReminded).toBe(1);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
        {
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
            params: {
              conventionId: miniStageConvention.id,
              internshipKind: miniStageConvention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  miniStageConvention.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: miniStageConvention.signatories.beneficiary.lastName,
              }),
              establishmentTutorFirstName: getFormattedFirstnameAndLastname({
                firstname: miniStageConvention.establishmentTutor.firstName,
              }),
              establishmentTutorLastName: getFormattedFirstnameAndLastname({
                lastname: miniStageConvention.establishmentTutor.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
            },
            recipients: [miniStageConvention.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        },
      ]);
      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
      ]);
    });
  });
});

const buildEstablishmentNotificationFrom = ({
  convention,
  createdAt,
}: {
  convention: ConventionDto;
  createdAt: DateString;
}): Notification => {
  return {
    id: "22222222-2222-4444-2222-222222222222",
    kind: "email",
    followedIds: {
      conventionId: convention.id,
    },
    createdAt: createdAt,
    templatedContent: {
      kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      recipients: [convention.establishmentTutor.email],
      sender: {
        email: "recette@immersion-facile.beta.gouv.fr",
        name: "Recette Immersion Facile",
      },
      cc: [],
      params: {
        agencyLogoUrl: undefined,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        assessmentCreationLink: "old-link",
      },
    },
  };
};
