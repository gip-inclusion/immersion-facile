import { AgencyDtoBuilder } from "shared";
import { makeExpectSavedNotificationsAndEvents } from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailWhenAgencyIsRejected } from "./SendEmailWhenAgencyIsRejected";

describe("SendEmailWhenAgencyIsRejected", () => {
  it("Sends an email to validators with agency name", async () => {
    // Prepare
    const uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const expectSavedNotificationsAndEvents =
      makeExpectSavedNotificationsAndEvents(
        uow.notificationRepository,
        uow.outboxRepository,
      );
    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    const useCase = new SendEmailWhenAgencyIsRejected(
      uowPerformer,
      saveNotificationAndRelatedEvent,
    );
    const updatedAgency = AgencyDtoBuilder.create()
      .withValidatorEmails(["toto@email.com"])
      .withName("just-rejected-agency")
      .withLogoUrl("https://logo.com")
      .withStatus("rejected")
      .withRejectionJustification("rejection justification")
      .build();

    // Act
    await useCase.execute({ agency: updatedAgency });

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_WAS_REJECTED",
          recipients: ["toto@email.com"],
          params: {
            agencyName: "just-rejected-agency",
            rejectionJustification: "rejection justification",
          },
        },
      ],
    });
  });
});
