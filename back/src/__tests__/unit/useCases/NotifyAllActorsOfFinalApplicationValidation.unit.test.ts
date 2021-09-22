import { expectEmailFinalValidationConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../../domain/demandeImmersion/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingSources: Set<ApplicationSource>;
  let sendConventionToAllActors: NotifyAllActorsOfFinalApplicationValidation;

  const validDemandeImmersion: DemandeImmersionDto =
    new DemandeImmersionEntityBuilder().build().toDto();

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    unrestrictedEmailSendingSources = new Set();
    sendConventionToAllActors = new NotifyAllActorsOfFinalApplicationValidation(
      emailGw,
      allowList,
      unrestrictedEmailSendingSources,
    );
  });

  test("Sends no emails when allowList and unrestrictedEmailSendingSources is empty", async () => {
    await sendConventionToAllActors.execute(validDemandeImmersion);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  test("Sends confirmation email to beneficiary when on allowList", async () => {
    allowList.add(validDemandeImmersion.email);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.email],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to mentor when on allowList", async () => {
    allowList.add(validDemandeImmersion.mentorEmail);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.mentorEmail],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to beneficiary and mentor when on allowList", async () => {
    allowList.add(validDemandeImmersion.email);
    allowList.add(validDemandeImmersion.mentorEmail);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.email, validDemandeImmersion.mentorEmail],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to beneficiary and mentor for unrestrictedEmailSendingSources", async () => {
    unrestrictedEmailSendingSources.add(validDemandeImmersion.source);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.email, validDemandeImmersion.mentorEmail],
      sentEmails[0],
      validDemandeImmersion,
    );
  });
});
