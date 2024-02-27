import { AgencyDtoBuilder } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeExpectSavedNotificationsAndEvents } from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailWhenAgencyIsActivated } from "./SendEmailWhenAgencyIsActivated";

describe("SendEmailWhenAgencyIsActivated", () => {
  it("Sends an email to counsellors and validators with agency name", async () => {
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
    const useCase = new SendEmailWhenAgencyIsActivated(
      uowPerformer,
      saveNotificationAndRelatedEvent,
    );

    const emailPresentInBoth = "in-both@mail.com";
    const counsellorEmails = ["councellor@email.com"];
    const validatorEmails = ["toto-valide@email.com"];

    const updatedAgency = AgencyDtoBuilder.create()
      .withCounsellorEmails([...counsellorEmails, emailPresentInBoth])
      .withValidatorEmails([...validatorEmails, emailPresentInBoth])
      .withName("just-activated-agency")
      .withLogoUrl("https://logo.com")
      .build();

    // Act
    await useCase.execute({ agency: updatedAgency });

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_WAS_ACTIVATED",
          recipients: [
            ...validatorEmails,
            emailPresentInBoth,
            ...counsellorEmails,
          ],
          params: {
            agencyName: "just-activated-agency",
            agencyLogoUrl: "https://logo.com",
            refersToOtherAgency: false,
          },
        },
      ],
    });
  });
});
