import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { expectedEmailConventionReviewMatchingConvention } from "../../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import { NotifyNewApplicationNeedsReview } from "./NotifyNewApplicationNeedsReview";

const defaultConvention = new ConventionDtoBuilder().build();
const validatorEmail = "myValidator@bob.yolo";
const defaultAgency = AgencyDtoBuilder.create(defaultConvention.agencyId)
  .withValidatorEmails([validatorEmail])
  .build();

describe("NotifyImmersionApplicationNeedsReview", () => {
  let uow: InMemoryUnitOfWork;
  let emailGw: InMemoryEmailGateway;
  let notifyNewConventionNeedsReview: NotifyNewApplicationNeedsReview;
  const timeGateway = new CustomTimeGateway();

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    uow = createInMemoryUow();

    notifyNewConventionNeedsReview = new NotifyNewApplicationNeedsReview(
      new InMemoryUowPerformer(uow),
      emailGw,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
    );
  });

  describe("When application status is IN_REVIEW", () => {
    let conventionInReview: ConventionDto;
    beforeEach(() => {
      conventionInReview = new ConventionDtoBuilder(defaultConvention)
        .withStatus("IN_REVIEW")
        .build();
    });

    it("Nominal case: Sends notification email to councellor, with 2 existing councellors", async () => {
      const counsellorEmails = [
        "aCouncellor@unmail.com",
        "anotherCouncellor@unmail.com",
      ];
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withCounsellorEmails(counsellorEmails)
        .build();

      uow.agencyRepository.setAgencies([agency]);

      await notifyNewConventionNeedsReview.execute(conventionInReview);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = counsellorEmails[i];
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: conventionInReview.id,
            role: "counsellor" as const,
            email,
            now: timeGateway.now(),
          };
        expectedEmailConventionReviewMatchingConvention({
          templatedEmail: sentEmails[i],
          recipient: email,
          convention: conventionInReview,
          magicLink: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.manageConvention,
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
          possibleRoleAction: "en vérifier l'éligibilité",
          agency,
        });
      }
    });

    it("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withValidatorEmails(validatorEmails)
        .build();
      uow.agencyRepository.setAgencies([agency]);
      await notifyNewConventionNeedsReview.execute(conventionInReview);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: conventionInReview.id,
            role: "validator" as const,
            email,
            now: timeGateway.now(),
          };
        expectedEmailConventionReviewMatchingConvention({
          templatedEmail: sentEmails[i],
          recipient: email,
          convention: conventionInReview,
          magicLink: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.manageConvention,
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
          possibleRoleAction: "en considérer la validation",
          agency,
        });
      }
    });

    it("No counsellors available, neither validators => ensure no mail is sent", async () => {
      await notifyNewConventionNeedsReview.execute(conventionInReview);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When application status is ACCEPTED_BY_COUNSELLOR", () => {
    let acceptedByCounsellorConvention: ConventionDto;
    beforeEach(() => {
      acceptedByCounsellorConvention = new ConventionDtoBuilder(
        defaultConvention,
      )
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .build();
    });

    it("Nominal case: Sends notification email to validators", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withValidatorEmails(validatorEmails)
        .build();
      uow.agencyRepository.setAgencies([agency]);
      await notifyNewConventionNeedsReview.execute(
        acceptedByCounsellorConvention,
      );

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: acceptedByCounsellorConvention.id,
            role: "validator" as const,
            email,
            now: timeGateway.now(),
          };
        expectedEmailConventionReviewMatchingConvention({
          templatedEmail: sentEmails[i],
          recipient: email,
          convention: acceptedByCounsellorConvention,
          magicLink: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.manageConvention,
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
          possibleRoleAction: "en considérer la validation",
          agency,
        });
      }
    });

    it("No validators available => ensure no mail is sent", async () => {
      await notifyNewConventionNeedsReview.execute(
        acceptedByCounsellorConvention,
      );
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When status is ACCEPTED_BY_VALIDATOR", () => {
    let acceptedByValidatorConvention: ConventionDto;
    beforeEach(() => {
      acceptedByValidatorConvention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
    });

    it("Nominal case: Sends notification email to admins", async () => {
      const adminEmail = "anAdmin@unmail.com";
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withAdminEmails([adminEmail])
        .build();
      uow.agencyRepository.setAgencies([agency]);

      await notifyNewConventionNeedsReview.execute(
        acceptedByValidatorConvention,
      );

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
        {
          id: acceptedByValidatorConvention.id,
          role: "admin" as const,
          email: adminEmail,
          now: timeGateway.now(),
        };
      expectedEmailConventionReviewMatchingConvention({
        templatedEmail: sentEmails[0],
        recipient: adminEmail,
        convention: acceptedByValidatorConvention,
        magicLink: fakeGenerateMagicLinkUrlFn({
          ...magicLinkCommonFields,
          targetRoute: frontRoutes.manageConvention,
        }),
        conventionStatusLink: fakeGenerateMagicLinkUrlFn({
          ...magicLinkCommonFields,
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        possibleRoleAction: "en considérer la validation",
        agency,
      });
    });

    it("No admin available => ensure no mail is sent", async () => {
      await notifyNewConventionNeedsReview.execute(
        acceptedByValidatorConvention,
      );
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });
});
