import { AllowListEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { NotifyConfirmationEstablishmentCreated as NotifyConfirmationEstablishmentCreated } from "../../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";
import { expectedEmailEstablisentCreatedReviewMatchingEstablisment } from "../../../_testBuilders/emailAssertions";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";

describe("NotifyConfirmationEstablismentCreated", () => {
  const validEstablishment = FormEstablishmentDtoBuilder.valid().build();
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    emailFilter = new AllowListEmailFilter([
      validEstablishment.businessContacts[0].email,
    ]);
  });

  const createUseCase = () => {
    return new NotifyConfirmationEstablishmentCreated(emailFilter, emailGw);
  };

  describe("When establishment is valid", () => {
    test("Nominal case: Sends notification email to Establisment contact", async () => {
      await createUseCase().execute(validEstablishment);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailEstablisentCreatedReviewMatchingEstablisment(
        sentEmails[0],
        validEstablishment,
      );
    });
  });

  test("Sends no emails when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(validEstablishment);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });
});
