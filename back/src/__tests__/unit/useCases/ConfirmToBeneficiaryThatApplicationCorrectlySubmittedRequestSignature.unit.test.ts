import { expectEmailBeneficiaryConfirmationSignatureRequestMatchingConvention } from "../../../_testBuilders/emailAssertions";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "../../../adapters/secondary/core/EmailFilterImplementations";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";

const validConvention: ConventionDto = new ConventionDtoBuilder().build();

describe("Add Convention Notifications", () => {
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature(
      emailFilter,
      emailGw,
      fakeGenerateMagicLinkUrlFn,
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    emailFilter = new AlwaysAllowEmailFilter();
  });

  it("Sends no emails when allowList empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(validConvention);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  it("Sends confirmation email to beneficiary when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([validConvention.email]);

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
