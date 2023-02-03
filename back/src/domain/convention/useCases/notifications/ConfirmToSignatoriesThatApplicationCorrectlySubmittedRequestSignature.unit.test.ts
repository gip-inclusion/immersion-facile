import { AgencyDto, ConventionDto, ConventionDtoBuilder } from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention } from "../../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/fakeGenerateMagicLinkUrlFn";
import { ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature } from "./ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature";

describe("Add Convention Notifications", () => {
  let confirmSignatoryConventionCorrectlySubmitted: ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature;
  let emailGw: InMemoryEmailGateway;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;
  let validConvention: ConventionDto;
  let agency: AgencyDto;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    agency = uow.agencyRepository.agencies[0];
    validConvention = new ConventionDtoBuilder()
      .withBeneficiaryRepresentative({
        firstName: "Tom",
        lastName: "Cruise",
        phone: "0665454271",
        role: "beneficiary-representative",
        email: "beneficiary@representative.fr",
      })
      .withAgencyId(agency.id)
      .build();

    confirmSignatoryConventionCorrectlySubmitted =
      new ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature(
        new InMemoryUowPerformer(uow),
        emailGw,
        fakeGenerateMagicLinkUrlFn,
        timeGateway,
      );
  });

  it("Sends confirmation email to all signatories", async () => {
    const now = new Date();
    timeGateway.setNextDate(now);
    const agency = uow.agencyRepository.agencies[0];
    await confirmSignatoryConventionCorrectlySubmitted.execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(3);

    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[0],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiary,
      recipient: validConvention.signatories.beneficiary.email,
      now,
      agency,
    });
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[1],
      convention: validConvention,
      signatory: validConvention.signatories.establishmentRepresentative,
      recipient: validConvention.signatories.establishmentRepresentative.email,
      now,
      agency,
    });
    expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: sentEmails[2],
      convention: validConvention,
      signatory: validConvention.signatories.beneficiaryRepresentative!,
      recipient: validConvention.signatories.beneficiaryRepresentative!.email,
      now,
      agency,
    });
  });
});
