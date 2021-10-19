import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { expectEmailBeneficiaryConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { InMemoryAgencyRepository } from "./../../../adapters/secondary/InMemoryAgencyRepository";
import { AgencyConfig } from "./../../../domain/immersionApplication/ports/AgencyRepository";
import { AgencyConfigBuilder } from "./../../../_testBuilders/AgencyConfigBuilder";

const validImmersionApplication: ImmersionApplicationDto =
  new ImmersionApplicationEntityBuilder().build().toDto();
const defaultAgencyConfig = AgencyConfigBuilder.create(
  validImmersionApplication.agencyCode,
).build();

describe("Add immersionApplication Notifications", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let agencyConfig: AgencyConfig;

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      emailGw,
      allowList,
      new InMemoryAgencyRepository({ [agencyConfig.id]: agencyConfig }),
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    agencyConfig = defaultAgencyConfig;
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
    agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
      .allowUnrestrictedEmailSending()
      .build();

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validImmersionApplication,
    );
  });
});
