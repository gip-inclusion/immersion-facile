import { expectEmailBeneficiaryConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../../domain/demandeImmersion/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";

describe("Add demandeImmersion Notifications", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingSources: Set<ApplicationSource>;

  const validDemandeImmersion: DemandeImmersionDto =
    new DemandeImmersionEntityBuilder().build().toDto();

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      emailGw,
      allowList,
      unrestrictedEmailSendingSources
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    unrestrictedEmailSendingSources = new Set();
  });

  test("Sends no emails when allowList and unrestrictedEmailSendingSources is empty", async () => {
    await createUseCase().execute(validDemandeImmersion);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  test("Sends confirmation email to beneficiary when on allowList", async () => {
    allowList.add(validDemandeImmersion.email);

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validDemandeImmersion
    );
  });

  test("Sends confirmation email when application source in unrestrictedEmailSendingSources", async () => {
    unrestrictedEmailSendingSources.add(validDemandeImmersion.source);

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validDemandeImmersion
    );
  });
});
