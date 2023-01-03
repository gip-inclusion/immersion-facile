import { ConventionDto, ConventionDtoBuilder } from "shared";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention } from "../../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/fakeGenerateMagicLinkUrlFn";
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
  let confirmSignatoryConventionCorrectlySubmitted: ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature;
  let emailGw: InMemoryEmailGateway;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    timeGateway = new CustomTimeGateway();
    confirmSignatoryConventionCorrectlySubmitted =
      new ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature(
        emailGw,
        fakeGenerateMagicLinkUrlFn,
        timeGateway,
      );
  });

  it("Sends confirmation email to all signatories", async () => {
    const now = new Date();
    timeGateway.setNextDate(now);
    await confirmSignatoryConventionCorrectlySubmitted.execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(3);
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[0],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiary,
      recipient: validConvention.signatories.beneficiary.email,
      now,
    });
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[1],
      convention: validConvention,
      signatory: validConvention.signatories.establishmentRepresentative,
      recipient: validConvention.signatories.establishmentRepresentative.email,
      now,
    });
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[2],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiaryRepresentative!,
      recipient: validConvention.signatories.beneficiaryRepresentative!.email,
      now,
    });
  });
});
