import { subMonths } from "date-fns";
import subDays from "date-fns/subDays";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type DateString,
  type Notification,
  expectObjectInArrayToMatch,
  frontRoutes,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import type { AssessmentEntity } from "../../convention/entities/AssessmentEntity";
import {
  type SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
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

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    const uowPerformer = new InMemoryUowPerformer(uow);
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      new UuidV4Generator(),
      timeGateway,
    );
    assessmentReminder = makeAssessmentReminder({
      uowPerformer,
      deps: {
        timeGateway,
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
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

      const { numberOfReminders } = await assessmentReminder.execute({
        mode: "10daysAfterInitialAssessmentEmail",
      });

      expect(numberOfReminders).toBe(0);
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

      const { numberOfReminders } = await assessmentReminder.execute({
        mode: "3daysAfterInitialAssessmentEmail",
      });

      expect(numberOfReminders).toBe(0);
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

    it("send first assessment reminder", async () => {
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention,
          createdAt: subDays(now, 3).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);

      const { numberOfReminders } = await assessmentReminder.execute({
        mode: "3daysAfterInitialAssessmentEmail",
      });

      expect(numberOfReminders).toBe(1);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
        {
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              establishmentTutorFirstName:
                convention.establishmentTutor.firstName,
              establishmentTutorLastName:
                convention.establishmentTutor.lastName,
              assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
                id: convention.id,
                email: convention.establishmentTutor.email,
                role: "establishment-tutor",
                targetRoute: frontRoutes.assessment,
                now,
              }),
            },
            recipients: [convention.establishmentTutor.email],
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

    it("send second assessment reminder", async () => {
      const initialEstablishmentNotification: Notification =
        buildEstablishmentNotificationFrom({
          convention,
          createdAt: subDays(now, 10).toISOString(),
        });
      await uow.notificationRepository.save(initialEstablishmentNotification);

      const { numberOfReminders } = await assessmentReminder.execute({
        mode: "10daysAfterInitialAssessmentEmail",
      });

      expect(numberOfReminders).toBe(1);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        initialEstablishmentNotification,
        {
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              establishmentTutorFirstName:
                convention.establishmentTutor.firstName,
              establishmentTutorLastName:
                convention.establishmentTutor.lastName,
              assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
                id: convention.id,
                email: convention.establishmentTutor.email,
                role: "establishment-tutor",
                targetRoute: frontRoutes.assessment,
                now,
              }),
            },
            recipients: [convention.establishmentTutor.email],
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
}: { convention: ConventionDto; createdAt: DateString }): Notification => {
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
