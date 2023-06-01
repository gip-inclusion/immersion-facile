import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { DeterministShortLinkIdGeneratorGateway } from "../../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { makeCreateNewEvent } from "../../../core/eventBus/EventBus";
import { makeShortLinkUrl } from "../../../core/ShortLink";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyNewApplicationNeedsReview } from "./NotifyNewApplicationNeedsReview";

const defaultConvention = new ConventionDtoBuilder().build();
const validatorEmail = "myValidator@bob.yolo";
const defaultAgency = AgencyDtoBuilder.create(defaultConvention.agencyId)
  .withValidatorEmails([validatorEmail])
  .build();

describe("NotifyImmersionApplicationNeedsReview", () => {
  let uow: InMemoryUnitOfWork;
  let notifyNewConventionNeedsReview: NotifyNewApplicationNeedsReview;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let config: AppConfig;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  const timeGateway = new CustomTimeGateway();

  beforeEach(() => {
    config = new AppConfigBuilder().build();
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    const uuidGenerator = new UuidV4Generator();
    const createNewEvent = makeCreateNewEvent({ uuidGenerator, timeGateway });
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      createNewEvent,
      uuidGenerator,
      timeGateway,
    );
    notifyNewConventionNeedsReview = new NotifyNewApplicationNeedsReview(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
      shortLinkIdGeneratorGateway,
      config,
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
      const shortLinkIds = [
        "shortlink1",
        "shortlink2",
        "shortlink3",
        "shortlink4",
      ];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
      const counsellorEmails = [
        "aCouncellor@unmail.com",
        "anotherCouncellor@unmail.com",
      ];
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withCounsellorEmails(counsellorEmails)
        .build();

      uow.agencyRepository.setAgencies([agency]);

      await notifyNewConventionNeedsReview.execute(conventionInReview);

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[0],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[1],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[0],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),

        [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[1],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
      });
      expectSavedNotificationsAndEvents({
        emails: [
          {
            type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [counsellorEmails[0]],
            params: {
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
              possibleRoleAction: "en vérifier l'éligibilité",
              agencyLogoUrl: agency.logoUrl,
            },
          },
          {
            type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [counsellorEmails[1]],
            params: {
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
              possibleRoleAction: "en vérifier l'éligibilité",
              agencyLogoUrl: agency.logoUrl,
            },
          },
        ],
      });
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
      const shortLinkIds = [
        "shortlink1",
        "shortlink2",
        "shortlink3",
        "shortlink4",
      ];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

      await notifyNewConventionNeedsReview.execute(conventionInReview);

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[0],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[1],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[0],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),

        [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[1],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validatorEmails[0]],
            params: {
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agency.logoUrl,
            },
          },
          {
            type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validatorEmails[1]],
            params: {
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agency.logoUrl,
            },
          },
        ],
      });
    });

    it("No counsellors available, neither validators => ensure no mail is sent", async () => {
      await notifyNewConventionNeedsReview.execute(conventionInReview);
      expectSavedNotificationsAndEvents({ emails: [] });
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
        const shortLinkIds = ["link1", "link2", "link3", "link4"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
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

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[0],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[1],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
          }),
          [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[0],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),

          [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[1],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
        });

        expectSavedNotificationsAndEvents({
          emails: [
            {
              type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [validatorEmails[0]],
              params: {
                internshipKind: acceptedByCounsellorConvention.internshipKind,
                beneficiaryFirstName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .firstName,
                beneficiaryLastName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .lastName,
                businessName: acceptedByCounsellorConvention.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl,
              },
            },
            {
              type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [validatorEmails[1]],
              params: {
                internshipKind: acceptedByCounsellorConvention.internshipKind,
                beneficiaryFirstName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .firstName,
                beneficiaryLastName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .lastName,
                businessName: acceptedByCounsellorConvention.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[3]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl,
              },
            },
          ],
        });
      });

      it("No validators available => ensure no mail is sent", async () => {
        await notifyNewConventionNeedsReview.execute(
          acceptedByCounsellorConvention,
        );
        expectSavedNotificationsAndEvents({ emails: [] });
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
        const shortLinkIds = ["link1", "link2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
        const adminEmail = "anAdmin@unmail.com";
        const agency = new AgencyDtoBuilder(defaultAgency)
          .withAdminEmails([adminEmail])
          .build();
        uow.agencyRepository.setAgencies([agency]);

        await notifyNewConventionNeedsReview.execute(
          acceptedByValidatorConvention,
        );

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByValidatorConvention.id,
            email: adminEmail,
            now: timeGateway.now(),
            role: "backOffice",
            targetRoute: frontRoutes.manageConvention,
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByValidatorConvention.id,
            email: adminEmail,
            now: timeGateway.now(),
            role: "backOffice",
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
        });

        expectSavedNotificationsAndEvents({
          emails: [
            {
              type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [adminEmail],
              params: {
                internshipKind: acceptedByValidatorConvention.internshipKind,
                beneficiaryFirstName:
                  acceptedByValidatorConvention.signatories.beneficiary
                    .firstName,
                beneficiaryLastName:
                  acceptedByValidatorConvention.signatories.beneficiary
                    .lastName,
                businessName: acceptedByValidatorConvention.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl,
              },
            },
          ],
        });
      });

      it("No admin available => ensure no mail is sent", async () => {
        await notifyNewConventionNeedsReview.execute(
          acceptedByValidatorConvention,
        );

        expectSavedNotificationsAndEvents({ emails: [] });
      });
    });
  });
});
