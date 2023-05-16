import { FormEstablishmentDtoBuilder } from "shared";
import { expectedEmailEstablishmentCreatedReviewMatchingEstablisment } from "../../../../_testBuilders/emailAssertions";
import { InMemoryNotificationGateway } from "../../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { NotifyConfirmationEstablishmentCreated } from "./NotifyConfirmationEstablishmentCreated";

describe("NotifyConfirmationEstablismentCreated", () => {
  const validEstablishment = FormEstablishmentDtoBuilder.valid().build();
  let notificationGateway: InMemoryNotificationGateway;

  beforeEach(() => {
    notificationGateway = new InMemoryNotificationGateway();
  });

  const createUseCase = () =>
    new NotifyConfirmationEstablishmentCreated(notificationGateway);

  describe("When establishment is valid", () => {
    it("Nominal case: Sends notification email to Establisment contact", async () => {
      await createUseCase().execute(validEstablishment);

      const sentEmails = notificationGateway.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailEstablishmentCreatedReviewMatchingEstablisment(
        sentEmails[0],
        validEstablishment,
      );
    });
  });
});
