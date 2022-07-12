import { ConventionDto } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { expectEmailBeneficiaryConfirmationSignatureRequestMatchingConvention } from "../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";

const validConvention: ConventionDto = new ConventionDtoBuilder().build();

describe("Add Convention Notifications", () => {
  let emailGw: InMemoryEmailGateway;

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature(
      emailGw,
      fakeGenerateMagicLinkUrlFn,
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
  });

  it("Sends confirmation email to beneficiary", async () => {
    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationSignatureRequestMatchingConvention(
      sentEmails[0],
      validConvention,
    );
  });

  it("Sends confirmation email when unrestricted email sending is enabled", async () => {
    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationSignatureRequestMatchingConvention(
      sentEmails[0],
      validConvention,
    );
  });
});
