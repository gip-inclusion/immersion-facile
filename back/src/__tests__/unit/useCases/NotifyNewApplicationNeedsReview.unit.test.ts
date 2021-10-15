import {
  AgencyConfigs,
  InMemoryAgencyRepository,
} from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { NotifyNewApplicationNeedsReview } from "../../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectedEmailImmersionApplicationReviewMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";

describe("NotifyImmersionApplicationNeedsReview", () => {
  let validImmersionApplication: ImmersionApplicationDto;
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

  describe("When application status is IN_REVIEW", () => {
    beforeEach(() => {
      validImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("IN_REVIEW")
        .build();
    });

    test("Nominal case: Sends notification email to councellor, with 2 existing councellors", async () => {
      const counsellorEmails = [
        "aCouncellor@unmail.com",
        "anotherCouncellor@unmail.com",
      ];

      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]: AgencyConfigBuilder.empty()
          .withCounsellorEmails(counsellorEmails)
          .build(),
      };

      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
        sentEmails[0],
        counsellorEmails,
        agencyConfigs[validImmersionApplication.agencyCode],
        validImmersionApplication,
        fakeGenerateMagicLinkUrlFn(validImmersionApplication.id, "counsellor"),
        "en vérifier l'éligibilité",
      );
    });

    test("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];

      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]: AgencyConfigBuilder.empty()
          .withValidatorEmails(validatorEmails)
          .build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
        sentEmails[0],
        validatorEmails,
        agencyConfigs[validImmersionApplication.agencyCode],
        validImmersionApplication,
        fakeGenerateMagicLinkUrlFn(validImmersionApplication.id, "validator"),
        "en considérer la validation",
      );
    });

    test("No counsellors available, neither validators => ensure no mail is sent", async () => {
      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]:
          AgencyConfigBuilder.empty().build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    test("No counsellors available, neither validators, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["aValidator@unmail.com"];
      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]: AgencyConfigBuilder.empty()
          .withAdminEmails(adminEmail)
          .build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When application status is ACCEPTED_BY_COUNSELLOR", () => {
    beforeEach(() => {
      validImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .build();
    });

    test("Nominal case: Sends notification email to validators", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];

      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]: AgencyConfigBuilder.empty()
          .withValidatorEmails(validatorEmails)
          .build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
        sentEmails[0],
        validatorEmails,
        agencyConfigs[validImmersionApplication.agencyCode],
        validImmersionApplication,
        fakeGenerateMagicLinkUrlFn(validImmersionApplication.id, "validator"),
        "en considérer la validation",
      );
    });

    test("No validators available => ensure no mail is sent", async () => {
      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]:
          AgencyConfigBuilder.empty().build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    test("No validators available, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["anAdmin@unmail.com"];
      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]: AgencyConfigBuilder.empty()
          .withAdminEmails(adminEmail)
          .build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

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
      const adminEmail = ["anAdmin@unmail.com"];
      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]: AgencyConfigBuilder.empty()
          .withAdminEmails(adminEmail)
          .build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
        sentEmails[0],
        adminEmail,
        agencyConfigs[validImmersionApplication.agencyCode],
        validImmersionApplication,
        fakeGenerateMagicLinkUrlFn(validImmersionApplication.id, "admin"),
        "en considérer la validation",
      );
    });

    test("No admin available => ensure no mail is sent", async () => {
      const agencyConfigs: AgencyConfigs = {
        [validImmersionApplication.agencyCode]:
          AgencyConfigBuilder.empty().build(),
      };
      await createUseCase(agencyConfigs).execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });
});
