import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  PeConnectIdentity,
  expectToEqual,
  frontRoutes,
} from "shared";
import { v4 as uuid } from "uuid";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { ConventionFtUserAdvisorEntity } from "../../../core/authentication/ft-connect/dto/FtConnect.dto";
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

describe("NotifyConventionNeedsReview", () => {
  const validator1 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("aValidator@unmail.com")
    .buildUser();
  const validator2 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("anotherValidator@unmail.com")
    .buildUser();
  const councellor1 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("aCouncellor@unmail.com")
    .build();
  const councellor2 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("anotherCouncellor@unmail.com")
    .build();

  const defaultConvention = new ConventionDtoBuilder().build();

  const agencyWithoutCouncellorsAndValidators = AgencyDtoBuilder.create(
    defaultConvention.agencyId,
  ).build();

  const agencyWithValidatorsOnly = toAgencyWithRights(
    agencyWithoutCouncellorsAndValidators,
    {
      [validator1.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
    },
  );
  const agencyWithCounsellorsAndValidators = toAgencyWithRights(
    agencyWithoutCouncellorsAndValidators,
    {
      [councellor1.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
      [councellor2.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
      [validator1.id]: { isNotifiedByEmail: false, roles: ["validator"] },
      [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
    },
  );

  const peAdvisorEmail = "pe-advisor@gmail.com";
  const peIdentity: PeConnectIdentity = {
    provider: "peConnect",
    token: "123",
  };

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
    notifyNewConventionNeedsReview = new NotifyNewConventionNeedsReview(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
      shortLinkIdGeneratorGateway,
      config,
    );
    uow.userRepository.users = [
      councellor1,
      councellor2,
      validator1,
      validator2,
    ];
  });

  describe("When convention status is IN_REVIEW", () => {
    beforeEach(() => {
      conventionInReview = new ConventionDtoBuilder(defaultConvention)
        .withStatus("IN_REVIEW")
        .build();
    });

    it("Nominal case: Sends notification email to councellor, with 2 existing councellors", async () => {
      uow.agencyRepository.agencies = [agencyWithCounsellorsAndValidators];

      const shortLinkIds = ["shortlink1", "shortlink2"];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReview,
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: councellor2.email,
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: councellor2.email,
          now: timeGateway.now(),
          role: "counsellor",
          targetRoute: frontRoutes.manageConvention,
        }),
      });
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [councellor2.email],
            params: {
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName:
                conventionInReview.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionInReview.signatories.beneficiary.lastName,
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
              possibleRoleAction: "en vérifier l'éligibilité",
              agencyLogoUrl:
                agencyWithoutCouncellorsAndValidators.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
        ],
      });
    });

    it("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
      uow.agencyRepository.agencies = [agencyWithValidatorsOnly];

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
          email: validator1.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validator2.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validator1.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReview.id,
          email: validator2.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validator1.email],
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
              agencyLogoUrl:
                agencyWithoutCouncellorsAndValidators.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validator2.email],
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
              agencyLogoUrl:
                agencyWithoutCouncellorsAndValidators.logoUrl ?? undefined,
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
      uow.agencyRepository.agencies = [agencyWithCounsellorsAndValidators];

      const conventionInReviewWithPeAdvisor = new ConventionDtoBuilder(
        defaultConvention,
      )
        .withStatus("IN_REVIEW")
        .withFederatedIdentity(peIdentity)
        .build();

      const shortLinkIds = [
        "shortlink1",
        "shortlink2",
        "shortlink3",
        "shortlink4",
      ];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: {
          email: peAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: peIdentity.token,
        conventionId: conventionInReviewWithPeAdvisor.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [userConventionAdvisor],
      );

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReviewWithPeAdvisor,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [councellor2.email],
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
              agencyLogoUrl:
                agencyWithCounsellorsAndValidators.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
        ],
      });
    });

    it("Sends notification email to peAdvisor and validators when beneficiary is PeConnected and beneficiary has PE advisor", async () => {
      uow.agencyRepository.agencies = [agencyWithValidatorsOnly];
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
        .withFederatedIdentity(peIdentity)
        .build();

      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: {
          email: peAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: peIdentity.token,
        conventionId: conventionInReviewWithPeAdvisor.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
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
          email: validator1.email,
          now: timeGateway.now(),
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
          email: validator2.email,
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
          email: validator1.email,
          now: timeGateway.now(),
        }),
        [shortLinkIds[5]]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
          email: validator2.email,
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
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
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
            recipients: [validator1.email],
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
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
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
            recipients: [validator2.email],
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
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
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

      uow.agencyRepository.agencies = [agencyWithValidatorsOnly];

      await notifyNewConventionNeedsReview.execute({
        convention: acceptedByCounsellorConvention,
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
          id: acceptedByCounsellorConvention.id,
          email: validator1.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
          id: acceptedByCounsellorConvention.id,
          email: validator2.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: acceptedByCounsellorConvention.id,
          email: validator1.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),

        [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
          id: acceptedByCounsellorConvention.id,
          email: validator2.email,
          now: timeGateway.now(),
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validator1.email],
            params: {
              conventionId: acceptedByCounsellorConvention.id,
              internshipKind: acceptedByCounsellorConvention.internshipKind,
              beneficiaryFirstName:
                acceptedByCounsellorConvention.signatories.beneficiary
                  .firstName,
              beneficiaryLastName:
                acceptedByCounsellorConvention.signatories.beneficiary.lastName,
              businessName: acceptedByCounsellorConvention.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[2]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[0]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
              validatorName: "",
              peAdvisor: undefined,
            },
          },
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [validator2.email],
            params: {
              conventionId: acceptedByCounsellorConvention.id,
              internshipKind: acceptedByCounsellorConvention.internshipKind,
              beneficiaryFirstName:
                acceptedByCounsellorConvention.signatories.beneficiary
                  .firstName,
              beneficiaryLastName:
                acceptedByCounsellorConvention.signatories.beneficiary.lastName,
              businessName: acceptedByCounsellorConvention.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[3]),
              conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
              possibleRoleAction: "en considérer la validation",
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
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
      uow.agencyRepository.agencies = [agencyWithValidatorsOnly];
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
          .withFederatedIdentity(peIdentity)
          .build();

      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: {
          email: peAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: peIdentity.token,
        conventionId: conventionAcceptedByCounsellorWithPeAdvisor.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
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
          email: validator1.email,
          now: timeGateway.now(),
        }),
        [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
          id: conventionAcceptedByCounsellorWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.conventionStatusDashboard,
          email: validator2.email,
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
          email: validator1.email,
          now: timeGateway.now(),
        }),
        [shortLinkIds[5]]: fakeGenerateMagicLinkUrlFn({
          id: conventionAcceptedByCounsellorWithPeAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
          email: validator2.email,
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
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
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
            recipients: [validator1.email],
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
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
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
            recipients: [validator2.email],
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
              agencyLogoUrl: agencyWithValidatorsOnly.logoUrl ?? undefined,
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
