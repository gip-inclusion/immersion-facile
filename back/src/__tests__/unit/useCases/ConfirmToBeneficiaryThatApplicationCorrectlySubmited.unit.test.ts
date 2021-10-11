import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { expectEmailBeneficiaryConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  AgencyConfigs,
  InMemoryAgencyRepository,
} from "./../../../adapters/secondary/InMemoryAgencyRepository";
import { AgencyConfigBuilder } from "./../../../_testBuilders/AgencyConfigBuilder";

describe("Add immersionApplication Notifications", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let agencyConfigs: AgencyConfigs;

  const validImmersionApplication: ImmersionApplicationDto =
    new ImmersionApplicationEntityBuilder().build().toDto();

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      emailGw,
      allowList,
      new InMemoryAgencyRepository(agencyConfigs),
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    agencyConfigs = {
      [validImmersionApplication.agencyCode]:
        AgencyConfigBuilder.empty().build(),
    };
  });

  test("Sends no emails when allowList and unrestricted email sending is disabled", async () => {
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

  test("Sends confirmation email when unrestricted email sending is enabled", async () => {
    agencyConfigs[validImmersionApplication.agencyCode] =
      AgencyConfigBuilder.empty().allowUnrestrictedEmailSending().build();

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validImmersionApplication,
    );
  });
});
