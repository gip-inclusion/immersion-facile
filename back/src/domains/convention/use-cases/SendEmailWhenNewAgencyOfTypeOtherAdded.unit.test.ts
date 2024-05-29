import { AgencyDtoBuilder } from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailWhenNewAgencyOfTypeOtherAdded } from "./SendEmailWhenNewAgencyOfTypeOtherAdded";

const emailPresentInBoth = "in-both@mail.com";
const counsellorEmails = ["councellor@email.com"];
const validatorEmails = ["toto-valide@email.com"];

const agency = new AgencyDtoBuilder()
  .withCounsellorEmails([...counsellorEmails, emailPresentInBoth])
  .withValidatorEmails([...validatorEmails, emailPresentInBoth])
  .withName("just-added-agency")
  .withLogoUrl("https://agency-logo.com")
  .withKind("autre")
  .build();

const peAgency = new AgencyDtoBuilder()
  .withCounsellorEmails([...counsellorEmails, emailPresentInBoth])
  .withValidatorEmails([...validatorEmails, emailPresentInBoth])
  .withName("just-added-agency")
  .withLogoUrl("https://agency-logo.com")
  .withKind("pole-emploi")
  .build();

const agencyWithRefersTo = new AgencyDtoBuilder()
  .withId("id-of-agency-refering-to-other")
  .withRefersToAgencyId(agency.id)
  .withCounsellorEmails(["councellor@email.com"])
  .withValidatorEmails(agency.validatorEmails)
  .withName("just-added-agency-refering-to-other-one")
  .withLogoUrl("https://agency-refering-logo.com")
  .withKind("autre")
  .build();

describe("Send email when agency of type other added ", () => {
  let uow: InMemoryUnitOfWork;
  let sendEmailWhenNewAgencyOfTypeOtherAdded: SendEmailWhenNewAgencyOfTypeOtherAdded;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
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
    sendEmailWhenNewAgencyOfTypeOtherAdded =
      new SendEmailWhenNewAgencyOfTypeOtherAdded(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      );
  });

  it("Sends email to counsellors and validators when agency of type other added", async () => {
    // Act
    await sendEmailWhenNewAgencyOfTypeOtherAdded.execute({ agency });

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_OF_TYPE_OTHER_ADDED",
          recipients: [
            ...validatorEmails,
            emailPresentInBoth,
            ...counsellorEmails,
          ],
          params: {
            agencyName: "just-added-agency",
            agencyLogoUrl: "https://agency-logo.com",
          },
        },
      ],
    });
  });

  it("doesn't send an email to agency if agency is refering to other agency ", async () => {
    await sendEmailWhenNewAgencyOfTypeOtherAdded.execute({
      agency: agencyWithRefersTo,
    });

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("doesn't send an email to agency if agency isn't of type 'autre' ", async () => {
    await sendEmailWhenNewAgencyOfTypeOtherAdded.execute({
      agency: peAgency,
    });

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });
});
