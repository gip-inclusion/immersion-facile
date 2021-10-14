import {
  AgencyConfigs,
  InMemoryAgencyRepository,
} from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import {
  GenerateMagicLinkFn,
  NotifyNewApplicationNeedsReview,
} from "../../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { ImmersionApplicationId } from "../../../shared/ImmersionApplicationDto";
import { Role } from "../../../shared/tokens/MagicLinkPayload";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectedEmailImmersionApplicationReviewMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";

const validDemandeImmersion = new ImmersionApplicationDtoBuilder().build();

const fakeGenerateMagicLinkUrlFn: GenerateMagicLinkFn = (
  applicationId: ImmersionApplicationId,
  role: Role,
) => `http://fake-magic-link/${applicationId}/${role}`;

describe("NotifyImmersionApplicationNeedsReview", () => {
  let emailGw: InMemoryEmailGateway;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = (agencyConfigs: AgencyConfigs) => {
    const inMemoryAgencyRepository = new InMemoryAgencyRepository(
      agencyConfigs,
    );
    return new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      fakeGenerateMagicLinkUrlFn,
    );
  };

  test("Nominal case: Sends notification email to councellor, with 2 existing councellors", async () => {
    const counsellorEmails = [
      "aCouncellor@unmail.com",
      "anotherCouncellor@unmail.com",
    ];

    const agencyConfigs: AgencyConfigs = {
      [validDemandeImmersion.agencyCode]: AgencyConfigBuilder.empty()
        .withCounsellorEmails(counsellorEmails)
        .build(),
    };

    await createUseCase(agencyConfigs).execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
      sentEmails[0],
      counsellorEmails,
      agencyConfigs[validDemandeImmersion.agencyCode],
      validDemandeImmersion,
      fakeGenerateMagicLinkUrlFn(validDemandeImmersion.id, "counsellor"),
      "en vérifier l'éligibilité",
    );
  });

  test("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
    const validatorEmails = [
      "aValidator@unmail.com",
      "anotherValidator@unmail.com",
    ];

    const agencyConfigs: AgencyConfigs = {
      [validDemandeImmersion.agencyCode]: AgencyConfigBuilder.empty()
        .withValidatorEmails(validatorEmails)
        .build(),
    };
    await createUseCase(agencyConfigs).execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
      sentEmails[0],
      validatorEmails,
      agencyConfigs[validDemandeImmersion.agencyCode],
      validDemandeImmersion,
      fakeGenerateMagicLinkUrlFn(validDemandeImmersion.id, "validator"),
      "en considérer la validation",
    );
  });

  test("No counsellors available, neither validators => ensure no mail is sent", async () => {
    const agencyConfigs: AgencyConfigs = {
      [validDemandeImmersion.agencyCode]: AgencyConfigBuilder.empty().build(),
    };
    await createUseCase(agencyConfigs).execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  test("No counsellors available, neither validators, still we got admins => ensure no mail is sent", async () => {
    const adminEmail = ["aValidator@unmail.com"];
    const agencyConfigs: AgencyConfigs = {
      [validDemandeImmersion.agencyCode]: AgencyConfigBuilder.empty()
        .withAdminEmails(adminEmail)
        .build(),
    };
    await createUseCase(agencyConfigs).execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });
});
