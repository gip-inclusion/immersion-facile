import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { AgencyCode } from "../../../shared/agencies";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { expectEmailBeneficiaryConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";

describe("Add immersionApplication Notifications", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingAgencies: Set<AgencyCode>;

  const validImmersionApplication: ImmersionApplicationDto =
    new ImmersionApplicationEntityBuilder().build().toDto();

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      emailGw,
      allowList,
      unrestrictedEmailSendingAgencies,
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    unrestrictedEmailSendingAgencies = new Set();
  });

  test("Sends no emails when allowList and unrestrictedEmailSendingAgencies is empty", async () => {
    await createUseCase().execute(validImmersionApplication);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  test("Sends confirmation email to beneficiary when on allowList", async () => {
    allowList.add(validImmersionApplication.email);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validImmersionApplication,
    );
  });

  test("Sends confirmation email when agency code in unrestrictedEmailSendingAgencies", async () => {
    unrestrictedEmailSendingAgencies.add(validImmersionApplication.agencyCode);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validImmersionApplication,
    );
  });
});
