import { FormEstablishmentDtoBuilder } from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyConfirmationEstablishmentCreated } from "./NotifyConfirmationEstablishmentCreated";

describe("NotifyConfirmationEstablishmentCreated", () => {
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
      await notifyConfirmationEstablishmentCreated.execute({
        formEstablishment: validEstablishment,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
            recipients: [validEstablishment.businessContact.email],
            params: {
              businessName: validEstablishment.businessName,
              contactFirstName: validEstablishment.businessContact.firstName,
              contactLastName: validEstablishment.businessContact.lastName,
              businessAddresses: validEstablishment.businessAddresses.map(
                ({ rawAddress }) => rawAddress,
              ),
            },
            cc: validEstablishment.businessContact.copyEmails,
          },
        ],
      });
    });
  });
});
