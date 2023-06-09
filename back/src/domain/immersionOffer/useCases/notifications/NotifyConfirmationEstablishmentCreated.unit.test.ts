import { FormEstablishmentDtoBuilder } from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyConfirmationEstablishmentCreated } from "./NotifyConfirmationEstablishmentCreated";

describe("NotifyConfirmationEstablismentCreated", () => {
  const validEstablishment = FormEstablishmentDtoBuilder.valid().build();
  let notifyConfirmationEstablishmentCreated: NotifyConfirmationEstablishmentCreated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    const uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const uuidGenerator = new UuidV4Generator();
    const timeGateway = new CustomTimeGateway();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    notifyConfirmationEstablishmentCreated =
      new NotifyConfirmationEstablishmentCreated(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      );
  });

  describe("When establishment is valid", () => {
    it("Nominal case: Sends notification email to Establisment contact", async () => {
      await notifyConfirmationEstablishmentCreated.execute(validEstablishment);

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
            recipients: [validEstablishment.businessContact.email],
            params: {
              businessName: validEstablishment.businessName,
              contactFirstName: validEstablishment.businessContact.firstName,
              contactLastName: validEstablishment.businessContact.lastName,
            },
            cc: validEstablishment.businessContact.copyEmails,
          },
        ],
      });
    });
  });
});
