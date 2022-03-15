import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { AgencyConfig } from "../../../domain/immersionApplication/ports/AgencyRepository";
import { NotifyNewApplicationNeedsReview } from "../../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectedEmailImmersionApplicationReviewMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { frontRoutes } from "../../../shared/routes";

const defaultImmersionApplication =
  new ImmersionApplicationDtoBuilder().build();
const defaultAgencyConfig = AgencyConfigBuilder.create(
  defaultImmersionApplication.agencyId,
).build();

describe("NotifyImmersionApplicationNeedsReview", () => {
  let validImmersionApplication: ImmersionApplicationDto;
  let emailGw: InMemoryEmailGateway;
  let agencyConfig: AgencyConfig;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    validImmersionApplication = defaultImmersionApplication;
    agencyConfig = defaultAgencyConfig;
  });

  const createUseCase = () => {
    const inMemoryAgencyRepository = new InMemoryAgencyRepository([
      agencyConfig,
    ]);
    return new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      fakeGenerateMagicLinkUrlFn,
    );
  };

  describe("When application status is IN_REVIEW", () => {
    beforeEach(() => {
      validImmersionApplication = new ImmersionApplicationDtoBuilder(
        defaultImmersionApplication,
      )
        .withStatus("IN_REVIEW")
        .build();
    });

    test("Nominal case: Sends notification email to councellor, with 2 existing councellors", async () => {
      const counsellorEmails = [
        "aCouncellor@unmail.com",
        "anotherCouncellor@unmail.com",
      ];
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .withCounsellorEmails(counsellorEmails)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = counsellorEmails[i];
        expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
          sentEmails[i],
          email,
          agencyConfig,
          validImmersionApplication,
          fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "counsellor",
            frontRoutes.immersionApplicationsToValidate,
            email,
          ),
          "en vérifier l'éligibilité",
        );
      }
    });

    test("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .withValidatorEmails(validatorEmails)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
          sentEmails[i],
          email,
          agencyConfig,
          validImmersionApplication,
          fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "validator",
            frontRoutes.immersionApplicationsToValidate,
            email,
          ),
          "en considérer la validation",
        );
      }
    });

    test("No counsellors available, neither validators => ensure no mail is sent", async () => {
      await createUseCase().execute(validImmersionApplication);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    test("No counsellors available, neither validators, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["aValidator@unmail.com"];
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .withAdminEmails(adminEmail)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When application status is ACCEPTED_BY_COUNSELLOR", () => {
    beforeEach(() => {
      validImmersionApplication = new ImmersionApplicationDtoBuilder(
        defaultImmersionApplication,
      )
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .build();
    });

    test("Nominal case: Sends notification email to validators", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .withValidatorEmails(validatorEmails)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
          sentEmails[i],
          email,
          agencyConfig,
          validImmersionApplication,
          fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "validator",
            frontRoutes.immersionApplicationsToValidate,
            email,
          ),
          "en considérer la validation",
        );
      }
    });

    test("No validators available => ensure no mail is sent", async () => {
      await createUseCase().execute(validImmersionApplication);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    test("No validators available, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["anAdmin@unmail.com"];
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .withAdminEmails(adminEmail)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When status is ACCEPTED_BY_VALIDATOR", () => {
    beforeEach(() => {
      validImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
    });

    test("Nominal case: Sends notification email to admins", async () => {
      const adminEmail = "anAdmin@unmail.com";
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .withAdminEmails([adminEmail])
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
        sentEmails[0],
        adminEmail,
        agencyConfig,
        validImmersionApplication,
        fakeGenerateMagicLinkUrlFn(
          validImmersionApplication.id,
          "admin",
          frontRoutes.immersionApplicationsToValidate,
          adminEmail,
        ),
        "en considérer la validation",
      );
    });

    test("No admin available => ensure no mail is sent", async () => {
      await createUseCase().execute(validImmersionApplication);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });
});
