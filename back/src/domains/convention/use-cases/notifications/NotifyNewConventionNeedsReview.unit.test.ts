import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  PeConnectIdentity,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationsAndEvents";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../core/authentication/pe-connect/dto/PeConnect.dto";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { makeShortLinkUrl } from "../../../core/short-link/ShortLink";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyNewConventionNeedsReview } from "./NotifyNewConventionNeedsReview";

const defaultConvention = new ConventionDtoBuilder().build();
const validatorEmail = "myValidator@bob.yolo";
const defaultAgency = AgencyDtoBuilder.create(defaultConvention.agencyId)
  .withValidatorEmails([validatorEmail])
  .build();

const peAdvisorEmail = "pe-advisor@gmail.com";
const peIdentity: PeConnectIdentity = {
  provider: "peConnect",
  token: "123",
};

const validatorEmails = [
  "aValidator@unmail.com",
  "anotherValidator@unmail.com",
];

describe("NotifyConventionNeedsReview", () => {
  let uow: InMemoryUnitOfWork;
  let notifyNewConventionNeedsReview: NotifyNewConventionNeedsReview;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let config: AppConfig;
  let conventionInReview: ConventionDto;
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
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    notifyNewConventionNeedsReview = new NotifyNewConventionNeedsReview(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
      shortLinkIdGeneratorGateway,
      config,
    );
  });

  describe("When convention status is IN_REVIEW", () => {
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

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReview,
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[0],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[1],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[0],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: counsellorEmails[1],
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.manageConvention,
        }),
      });
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [counsellorEmails[0]],
            params: {
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[2]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
              possibleRoleAction: "en vérifier l'éligibilité",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [counsellorEmails[1]],
            params: {
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[3]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
              possibleRoleAction: "en vérifier l'éligibilité",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
        ],
      });
    });

    it("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
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

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReview,
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[0],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[1],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[0],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validatorEmails[1],
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validatorEmails[0]],
            params: {
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[2]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validatorEmails[1]],
            params: {
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[3]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
        ],
      });
    });

    it("No counsellors available, neither validators => ensure no mail is sent", async () => {
      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReview,
      });
      expectSavedNotificationsAndEvents({ emails: [] });
    });

    it("sends notification to counsellors (when they exist), even if there is a peAdvisor", async () => {
      const counsellorEmail = "some@counsellor.com";
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withCounsellorEmails([counsellorEmail])
        .build();
      uow.agencyRepository.setAgencies([agency]);

      const conventionInReviewWithPeAdvisor = new ConventionDtoBuilder(
        defaultConvention,
      )
        .withStatus("IN_REVIEW")
        .withAgencyId(agency.id)
        .withFederatedIdentity(peIdentity)
        .build();

      const shortLinkIds = [
        "shortlink1",
        "shortlink2",
        "shortlink3",
        "shortlink4",
      ];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

      const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
        _entityName: "ConventionPoleEmploiAdvisor",
        advisor: {
          email: peAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: peIdentity.token,
        conventionId: conventionInReviewWithPeAdvisor.id,
      };

      uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
        [userConventionAdvisor],
      );

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReviewWithPeAdvisor,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [counsellorEmail],
            params: {
              conventionId: conventionInReviewWithPeAdvisor.id,
              internshipKind: conventionInReviewWithPeAdvisor.internshipKind,
              beneficiaryFirstName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .firstName,
              beneficiaryLastName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .lastName,
              businessName: conventionInReviewWithPeAdvisor.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
              possibleRoleAction: "en vérifier l'éligibilité",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
        ],
      });
    });

    it("Sends notification email to peAdvisor and validators when beneficiary is PeConnected and beneficiary has PE advisor", async () => {
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withValidatorEmails(validatorEmails)
        .build();

      uow.agencyRepository.setAgencies([agency]);
      const shortLinkIds = [
        "shortlink1",
        "shortlink2",
        "shortlink3",
        "shortlink4",
        "shortlink5",
        "shortlink6",
      ];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

      const conventionInReviewWithPeAdvisor = new ConventionDtoBuilder(
        defaultConvention,
      )
        .withStatus("IN_REVIEW")
        .withAgencyId(agency.id)
        .withFederatedIdentity(peIdentity)
        .build();

      const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
        _entityName: "ConventionPoleEmploiAdvisor",
        advisor: {
          email: peAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: peIdentity.token,
        conventionId: conventionInReviewWithPeAdvisor.id,
      };

      uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
        [userConventionAdvisor],
      );

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReviewWithPeAdvisor,
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
          email: peAdvisorEmail,
          now: timeGateway.now(),
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
          email: validatorEmails[0],
          now: timeGateway.now(),
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
          email: validatorEmails[1],
          now: timeGateway.now(),
        }),
        [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
          email: peAdvisorEmail,
          now: timeGateway.now(),
        }),
        [shortLinkIds[4]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
          email: validatorEmails[0],
          now: timeGateway.now(),
        }),
        [shortLinkIds[5]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
          email: validatorEmails[1],
          now: timeGateway.now(),
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [peAdvisorEmail],
            params: {
              conventionId: conventionInReviewWithPeAdvisor.id,
              internshipKind: conventionInReviewWithPeAdvisor.internshipKind,
              beneficiaryFirstName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .firstName,
              beneficiaryLastName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .lastName,
              businessName: conventionInReviewWithPeAdvisor.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[3]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: {
                recipientIsPeAdvisor: true,
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                ...userConventionAdvisor.advisor!,
              },
            },
          },
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validatorEmails[0]],
            params: {
              conventionId: conventionInReviewWithPeAdvisor.id,
              internshipKind: conventionInReviewWithPeAdvisor.internshipKind,
              beneficiaryFirstName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .firstName,
              beneficiaryLastName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .lastName,
              businessName: conventionInReviewWithPeAdvisor.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[4]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: {
                recipientIsPeAdvisor: false,
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                ...userConventionAdvisor.advisor!,
              },
            },
          },
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validatorEmails[1]],
            params: {
              conventionId: conventionInReviewWithPeAdvisor.id,
              internshipKind: conventionInReviewWithPeAdvisor.internshipKind,
              beneficiaryFirstName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .firstName,
              beneficiaryLastName:
                conventionInReviewWithPeAdvisor.signatories.beneficiary
                  .lastName,
              businessName: conventionInReviewWithPeAdvisor.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[5]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agency.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: {
                recipientIsPeAdvisor: false,
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                ...userConventionAdvisor.advisor!,
              },
            },
          },
        ],
      });
    });

    describe("When convention status is ACCEPTED_BY_COUNSELLOR", () => {
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
        const agency = new AgencyDtoBuilder(defaultAgency)
          .withValidatorEmails(validatorEmails)
          .build();

        uow.agencyRepository.setAgencies([agency]);

        await notifyNewConventionNeedsReview.execute({
          convention: acceptedByCounsellorConvention,
        });

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[0],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[1],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
          [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[0],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
          }),

          [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
            id: acceptedByCounsellorConvention.id,
            email: validatorEmails[1],
            now: timeGateway.now(),
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
          }),
        });

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [validatorEmails[0]],
              params: {
                conventionId: acceptedByCounsellorConvention.id,
                internshipKind: acceptedByCounsellorConvention.internshipKind,
                beneficiaryFirstName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .firstName,
                beneficiaryLastName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .lastName,
                businessName: acceptedByCounsellorConvention.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[2]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl ?? undefined,
                validatorName: "",
                peAdvisor: undefined,
              },
            },
            {
              kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [validatorEmails[1]],
              params: {
                conventionId: acceptedByCounsellorConvention.id,
                internshipKind: acceptedByCounsellorConvention.internshipKind,
                beneficiaryFirstName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .firstName,
                beneficiaryLastName:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .lastName,
                businessName: acceptedByCounsellorConvention.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[3]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl ?? undefined,
                validatorName: "",
                peAdvisor: undefined,
              },
            },
          ],
        });
      });

      it("No validators available => ensure no mail is sent", async () => {
        await notifyNewConventionNeedsReview.execute({
          convention: acceptedByCounsellorConvention,
        });
        expectSavedNotificationsAndEvents({ emails: [] });
      });

      it("Sends notification email to peAdvisor and validators when beneficiary is PeConnected and beneficiary has PE advisor", async () => {
        const agency = new AgencyDtoBuilder(defaultAgency)
          .withValidatorEmails(validatorEmails)
          .build();

        uow.agencyRepository.setAgencies([agency]);
        const shortLinkIds = [
          "shortlink1",
          "shortlink2",
          "shortlink3",
          "shortlink4",
          "shortlink5",
          "shortlink6",
        ];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        const conventionAcceptedByCounsellorWithPeAdvisor =
          new ConventionDtoBuilder(defaultConvention)
            .withStatus("ACCEPTED_BY_COUNSELLOR")
            .withAgencyId(agency.id)
            .withFederatedIdentity(peIdentity)
            .build();

        const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
          _entityName: "ConventionPoleEmploiAdvisor",
          advisor: {
            email: peAdvisorEmail,
            firstName: "Elsa",
            lastName: "Oldenburg",
            type: "CAPEMPLOI",
          },
          peExternalId: peIdentity.token,
          conventionId: conventionAcceptedByCounsellorWithPeAdvisor.id,
        };

        uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
          [userConventionAdvisor],
        );

        await notifyNewConventionNeedsReview.execute({
          convention: conventionAcceptedByCounsellorWithPeAdvisor,
        });

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: conventionAcceptedByCounsellorWithPeAdvisor.id,
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: peAdvisorEmail,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: conventionAcceptedByCounsellorWithPeAdvisor.id,
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: validatorEmails[0],
            now: timeGateway.now(),
          }),
          [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
            id: conventionAcceptedByCounsellorWithPeAdvisor.id,
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: validatorEmails[1],
            now: timeGateway.now(),
          }),
          [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
            id: conventionAcceptedByCounsellorWithPeAdvisor.id,
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
            email: peAdvisorEmail,
            now: timeGateway.now(),
          }),
          [shortLinkIds[4]]: fakeGenerateMagicLinkUrlFn({
            id: conventionAcceptedByCounsellorWithPeAdvisor.id,
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
            email: validatorEmails[0],
            now: timeGateway.now(),
          }),
          [shortLinkIds[5]]: fakeGenerateMagicLinkUrlFn({
            id: conventionAcceptedByCounsellorWithPeAdvisor.id,
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
            email: validatorEmails[1],
            now: timeGateway.now(),
          }),
        });

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [peAdvisorEmail],
              params: {
                conventionId: conventionAcceptedByCounsellorWithPeAdvisor.id,
                internshipKind:
                  conventionAcceptedByCounsellorWithPeAdvisor.internshipKind,
                beneficiaryFirstName:
                  conventionAcceptedByCounsellorWithPeAdvisor.signatories
                    .beneficiary.firstName,
                beneficiaryLastName:
                  conventionAcceptedByCounsellorWithPeAdvisor.signatories
                    .beneficiary.lastName,
                businessName:
                  conventionAcceptedByCounsellorWithPeAdvisor.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[3]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl ?? undefined,
                validatorName: "",
                peAdvisor: {
                  recipientIsPeAdvisor: true,
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  ...userConventionAdvisor.advisor!,
                },
              },
            },
            {
              kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [validatorEmails[0]],
              params: {
                conventionId: conventionAcceptedByCounsellorWithPeAdvisor.id,
                internshipKind:
                  conventionAcceptedByCounsellorWithPeAdvisor.internshipKind,
                beneficiaryFirstName:
                  conventionAcceptedByCounsellorWithPeAdvisor.signatories
                    .beneficiary.firstName,
                beneficiaryLastName:
                  conventionAcceptedByCounsellorWithPeAdvisor.signatories
                    .beneficiary.lastName,
                businessName:
                  conventionAcceptedByCounsellorWithPeAdvisor.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[4]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl ?? undefined,
                validatorName: "",
                peAdvisor: {
                  recipientIsPeAdvisor: false,
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  ...userConventionAdvisor.advisor!,
                },
              },
            },
            {
              kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
              recipients: [validatorEmails[1]],
              params: {
                conventionId: conventionAcceptedByCounsellorWithPeAdvisor.id,
                internshipKind:
                  conventionAcceptedByCounsellorWithPeAdvisor.internshipKind,
                beneficiaryFirstName:
                  conventionAcceptedByCounsellorWithPeAdvisor.signatories
                    .beneficiary.firstName,
                beneficiaryLastName:
                  conventionAcceptedByCounsellorWithPeAdvisor.signatories
                    .beneficiary.lastName,
                businessName:
                  conventionAcceptedByCounsellorWithPeAdvisor.businessName,
                magicLink: makeShortLinkUrl(config, shortLinkIds[5]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[2]),
                possibleRoleAction: "en considérer la validation",
                agencyLogoUrl: agency.logoUrl ?? undefined,
                validatorName: "",
                peAdvisor: {
                  recipientIsPeAdvisor: false,
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  ...userConventionAdvisor.advisor!,
                },
              },
            },
          ],
        });
      });
    });
  });
});
