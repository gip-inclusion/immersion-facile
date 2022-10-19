import { ConventionDto, ConventionDtoBuilder } from "shared";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention } from "../../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/test.helpers";
import { ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature } from "./ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature";

const validConvention: ConventionDto = new ConventionDtoBuilder()
  .withBeneficiaryRepresentative({
    firstName: "Tom",
    lastName: "Cruise",
    phone: "0665454271",
    role: "beneficiary-representative",
    email: "beneficiary@representative.fr",
  })
  .build();

describe("Add Convention Notifications", () => {
  let emailGw: InMemoryEmailGateway;

  const createUseCase = () =>
    new ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature(
      emailGw,
      fakeGenerateMagicLinkUrlFn,
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
  });

  it("Sends confirmation email to all signatories", async () => {
    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(3);
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[0],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiary,
      recipient: validConvention.signatories.beneficiary.email,
    });
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[1],
      convention: validConvention,
      signatory: validConvention.signatories.establishmentRepresentative,
      recipient: validConvention.signatories.establishmentRepresentative.email,
    });
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[2],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiaryRepresentative!,
      recipient: validConvention.signatories.beneficiaryRepresentative!.email,
    });
  });
});
