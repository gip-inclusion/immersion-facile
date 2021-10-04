import { expectEmailBeneficiaryConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import {
  ApplicationSource,
  ImmersionApplicationDto,
} from "../../../shared/ImmersionApplicationDto";

describe("Add immersionApplication Notifications", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingSources: Set<ApplicationSource>;

  const validImmersionApplication: ImmersionApplicationDto =
    new ImmersionApplicationEntityBuilder().build().toDto();

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      emailGw,
      allowList,
      unrestrictedEmailSendingSources,
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    unrestrictedEmailSendingSources = new Set();
  });

  test("Sends no emails when allowList and unrestrictedEmailSendingSources is empty", async () => {
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

  test("Sends confirmation email when application source in unrestrictedEmailSendingSources", async () => {
    unrestrictedEmailSendingSources.add(validImmersionApplication.source);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validImmersionApplication,
    );
  });
});
