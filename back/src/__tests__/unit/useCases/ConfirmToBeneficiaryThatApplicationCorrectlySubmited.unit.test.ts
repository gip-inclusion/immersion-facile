import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { FeatureFlags } from "../../../shared/featureFlags";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { expectEmailBeneficiaryConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "../../../adapters/secondary/core/EmailFilterImplementations";

const validImmersionApplication: ImmersionApplicationDto =
  new ImmersionApplicationEntityBuilder().build().toDto();

describe("Add immersionApplication Notifications", () => {
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;
  let featureFlags: FeatureFlags;

  const createUseCase = () =>
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      emailFilter,
      emailGw,
      featureFlags,
    );

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    emailFilter = new AlwaysAllowEmailFilter();
    featureFlags = FeatureFlagsBuilder.allOff().build();
  });

  test("Sends no emails when allowList empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(validImmersionApplication);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  test("Sends confirmation email to beneficiary when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([validImmersionApplication.email]);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validImmersionApplication,
    );
  });

  test("Sends confirmation email when unrestricted email sending is enabled", async () => {
    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validImmersionApplication,
    );
  });
});
