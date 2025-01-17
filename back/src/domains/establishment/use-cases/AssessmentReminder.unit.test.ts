import subDays from "date-fns/subDays";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  Notification,
  expectObjectInArrayToMatch,
  frontRoutes,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  AssessmentReminder,
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

  it("send first assessment reminder", async () => {
    const now = timeGateway.now();
    const conventionEndDate = subDays(now, 3);
    const agency = new AgencyDtoBuilder().build();
    const convention = new ConventionDtoBuilder()
      .withDateEnd(conventionEndDate.toISOString())
      .withAgencyId(agency.id)
      .build();
    const validator = new InclusionConnectedUserBuilder()
      .withId("10000000-0000-0000-0000-000000000003")
      .withEmail("validator@agency1.fr")
      .buildUser();
    await uow.userRepository.save(validator);
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [validator.id]: {
          isNotifiedByEmail: true,
          roles: ["validator"],
        },
      }),
    ];
    const assessmentNotificationDate = subDays(conventionEndDate, 1);
    const notification: Notification = {
      createdAt: assessmentNotificationDate.toISOString(),
      followedIds: {
        conventionId: convention.id,
        agencyId: convention.agencyId,
        establishmentSiret: convention.siret,
      },
      id: "first--assessment-notification",
      kind: "email",
      templatedContent: {
        kind: "ASSESSMENT_AGENCY_NOTIFICATION",
        params: {
          internshipKind: "immersion",
          assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
            email: convention.establishmentTutor.email,
            id: convention.id,
            targetRoute: "bilan-immersion",
            role: "establishment-tutor",
            now: assessmentNotificationDate,
          }),
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          conventionId: convention.id,
          agencyLogoUrl: undefined,
          businessName: "",
        },
        recipients: [convention.establishmentTutor.email],
        sender: {
          email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
          name: "Immersion Facilitée",
        },
      },
    };
    await uow.conventionRepository.save(convention);
    await uow.notificationRepository.save(notification);

    const { numberOfFirstReminders } = await assessmentReminder.execute({
      mode: "3daysAfterConventionEnd",
    });

    expect(numberOfFirstReminders).toBe(1);
    expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
      notification,
      {
        templatedContent: {
          kind: "ASSESSMENT_AGENCY_FIRST_REMINDER",
          params: {
            conventionId: convention.id,
            internshipKind: convention.internshipKind,
            businessName: convention.businessName,
            establishmentContactEmail:
              convention.signatories.establishmentRepresentative.email,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              email: validator.email,
              role: "validator",
              targetRoute: frontRoutes.assessment,
              now,
            }),
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
    ]);
  });
});
