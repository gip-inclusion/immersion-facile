import { ConventionDtoBuilder, ConventionId, expectToEqual } from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { makeTestDomainEvent } from "../../core/events/test.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendBeneficiariesPdfAssessmentsEmails } from "./SendBeneficiariesPdfAssessmentsEmails";

describe("SendBeneficiariesPdfAssessmentsEmails", () => {
  const id: ConventionId = "immersion-ending-tomorrow-id";

  let uow: InMemoryUnitOfWork;
  let sendBeneficiaryAssesmentEmail: SendBeneficiariesPdfAssessmentsEmails;
  let timeGateway: CustomTimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    sendBeneficiaryAssesmentEmail = new SendBeneficiariesPdfAssessmentsEmails(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      timeGateway,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
    );
  });

  it("Sends an email to immersions ending tomorrow", async () => {
    const expectedAgency = uow.agencyRepository.agencies[0];
    const conventionEndingTomorrow = new ConventionDtoBuilder()
      .withAgencyId(expectedAgency.id)
      .withDateStart("2023-11-17T10:00:00.000Z")
      .withDateEnd("2023-11-22T10:00:00.000Z")
      .withId(id)
      .withEstablishmentTutorFirstName("Tom")
      .withEstablishmentTutorLastName("Cruise")
      .validated()
      .build();
    const conventionEndingYesterday = new ConventionDtoBuilder()
      .withAgencyId(expectedAgency.id)
      .withDateEnd("2023-11-20T10:00:00.000Z")
      .validated()
      .build();

    await uow.conventionRepository.save(conventionEndingTomorrow);
    await uow.conventionRepository.save(conventionEndingYesterday);

    const now = new Date("2023-11-21T08:00:00.000Z");
    timeGateway.setNextDates([now, now]);

    await sendBeneficiaryAssesmentEmail.execute();

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "BENEFICIARY_ASSESSMENT_NOTIFICATION",
          params: {
            conventionId: conventionEndingTomorrow.id,
            beneficiaryLastName:
              conventionEndingTomorrow.signatories.beneficiary.lastName,
            beneficiaryFirstName:
              conventionEndingTomorrow.signatories.beneficiary.firstName,
            agencyValidatorEmail: expectedAgency.validatorEmails[0],
            businessName: conventionEndingTomorrow.businessName,
            internshipKind: conventionEndingTomorrow.internshipKind,
            agencyAssessmentDocumentLink:
              expectedAgency.questionnaireUrl ?? undefined,
          },
          recipients: [conventionEndingTomorrow.signatories.beneficiary.email],
          sender: {
            email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
            name: "Immersion Facilitée",
          },
        },
      ],
    });
    expect(uow.outboxRepository.events).toHaveLength(2);
    expectToEqual(uow.outboxRepository.events[0].topic, "NotificationAdded");
    expect(uow.outboxRepository.events[1].payload).toMatchObject({
      id,
    });
    expectToEqual(
      uow.outboxRepository.events[1].topic,
      "BeneficiaryAssessmentEmailSent",
    );
  });

  it("Doesn't send an email to beneficiary that already received one", async () => {
    const conventionEndingTomorrow = new ConventionDtoBuilder()
      .withDateEnd("2023-11-22T10:00:00.000Z")
      .validated()
      .withId(id)
      .build();
    await uow.conventionRepository.save(conventionEndingTomorrow);
    await uow.outboxRepository.save(
      makeTestDomainEvent({
        topic: "BeneficiaryAssessmentEmailSent",
        payload: { id: conventionEndingTomorrow.id },
      }),
    );

    timeGateway.setNextDate(new Date("2021-05-21T08:00:00.000Z"));

    await sendBeneficiaryAssesmentEmail.execute();

    expectSavedNotificationsAndEvents({
      emails: [],
    });

    expectToEqual(
      uow.outboxRepository.events[0].topic,
      "BeneficiaryAssessmentEmailSent",
    );
  });
});
