import { AgencyDtoBuilder } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { makeExpectSavedNotificationsAndEvents } from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { makeSaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
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
