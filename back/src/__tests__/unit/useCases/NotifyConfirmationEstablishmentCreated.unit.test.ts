import { FormEstablishmentDtoBuilder } from "shared/src/formEstablishment/FormEstablishmentDtoBuilder";
import { expectedEmailEstablishmentCreatedReviewMatchingEstablisment } from "../../../_testBuilders/emailAssertions";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { NotifyConfirmationEstablishmentCreated as NotifyConfirmationEstablishmentCreated } from "../../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";

describe("NotifyConfirmationEstablismentCreated", () => {
  const validEstablishment = FormEstablishmentDtoBuilder.valid().build();
  let emailGw: InMemoryEmailGateway;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () =>
    new NotifyConfirmationEstablishmentCreated(emailGw);

  describe("When establishment is valid", () => {
    it("Nominal case: Sends notification email to Establisment contact", async () => {
      await createUseCase().execute(validEstablishment);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailEstablishmentCreatedReviewMatchingEstablisment(
        sentEmails[0],
        validEstablishment,
      );
    });
  });
});
