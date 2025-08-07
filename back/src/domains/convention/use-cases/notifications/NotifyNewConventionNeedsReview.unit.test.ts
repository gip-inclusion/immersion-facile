import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  expectToEqual,
  type FtConnectIdentity,
  frontRoutes,
  getFormattedFirstnameAndLastname,
} from "shared";
import { v4 as uuid } from "uuid";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import type { ConventionFtUserAdvisorEntity } from "../../../core/authentication/ft-connect/dto/FtConnect.dto";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { makeShortLinkUrl } from "../../../core/short-link/ShortLink";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyNewConventionNeedsReview } from "./NotifyNewConventionNeedsReview";

describe("NotifyConventionNeedsReview", () => {
  const validator1 = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("aValidator@unmail.com")
    .buildUser();
  const validator2 = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("anotherValidator@unmail.com")
    .buildUser();
  const councellor1 = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("aCouncellor@unmail.com")
    .build();
  const councellor2 = new ConnectedUserBuilder()
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

  const ftAdvisorEmail = "ft-advisor@gmail.com";
  const ftIdentity: FtConnectIdentity = {
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

      const shortLinkIds = ["shortlink1"];
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
          targetRoute: frontRoutes.manageConvention,
        }),
      });
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [councellor2.email],
            params: {
              agencyReferentName: getFormattedFirstnameAndLastname(
                conventionInReview.agencyReferent ?? {},
              ),
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: conventionInReview.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: conventionInReview.signatories.beneficiary.lastName,
              }),
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
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

      const shortLinkIds = ["shortlink1", "shortlink2"];
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
          targetRoute: frontRoutes.manageConvention,
        }),
        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
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
              agencyReferentName: getFormattedFirstnameAndLastname(
                conventionInReview.agencyReferent ?? {},
              ),
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: conventionInReview.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: conventionInReview.signatories.beneficiary.lastName,
              }),
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
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
              agencyReferentName: getFormattedFirstnameAndLastname(
                conventionInReview.agencyReferent ?? {},
              ),
              conventionId: conventionInReview.id,
              internshipKind: conventionInReview.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname: conventionInReview.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname: conventionInReview.signatories.beneficiary.lastName,
              }),
              businessName: conventionInReview.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
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

      const conventionInReviewWithFtAdvisor = new ConventionDtoBuilder(
        defaultConvention,
      )
        .withStatus("IN_REVIEW")
        .withFederatedIdentity(ftIdentity)
        .build();

      const shortLinkIds = ["shortlink1"];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: {
          email: ftAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: ftIdentity.token,
        conventionId: conventionInReviewWithFtAdvisor.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [userConventionAdvisor],
      );

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReviewWithFtAdvisor,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [councellor2.email],
            params: {
              agencyReferentName: getFormattedFirstnameAndLastname(
                conventionInReviewWithFtAdvisor.agencyReferent ?? {},
              ),
              conventionId: conventionInReviewWithFtAdvisor.id,
              internshipKind: conventionInReviewWithFtAdvisor.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionInReviewWithFtAdvisor.signatories.beneficiary
                    .firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionInReviewWithFtAdvisor.signatories.beneficiary
                    .lastName,
              }),
              businessName: conventionInReviewWithFtAdvisor.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
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

    it("Sends notification email only to peAdvisor when beneficiary is PeConnected and beneficiary has PE advisor", async () => {
      uow.agencyRepository.agencies = [agencyWithValidatorsOnly];
      const shortLinkId = "shortlink1";
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

      const conventionInReviewWithFtAdvisor = new ConventionDtoBuilder(
        defaultConvention,
      )
        .withStatus("IN_REVIEW")
        .withFederatedIdentity(ftIdentity)
        .build();

      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: {
          email: ftAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: ftIdentity.token,
        conventionId: conventionInReviewWithFtAdvisor.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [userConventionAdvisor],
      );

      await notifyNewConventionNeedsReview.execute({
        convention: conventionInReviewWithFtAdvisor,
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkId]: fakeGenerateMagicLinkUrlFn({
          id: conventionInReviewWithFtAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
          email: ftAdvisorEmail,
          now: timeGateway.now(),
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [ftAdvisorEmail],
            params: {
              agencyReferentName: getFormattedFirstnameAndLastname(
                conventionInReviewWithFtAdvisor.agencyReferent ?? {},
              ),
              conventionId: conventionInReviewWithFtAdvisor.id,
              internshipKind: conventionInReviewWithFtAdvisor.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionInReviewWithFtAdvisor.signatories.beneficiary
                    .firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionInReviewWithFtAdvisor.signatories.beneficiary
                    .lastName,
              }),
              businessName: conventionInReviewWithFtAdvisor.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkId),
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
          targetRoute: frontRoutes.manageConvention,
        }),

        [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
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
              agencyReferentName: getFormattedFirstnameAndLastname(
                acceptedByCounsellorConvention.agencyReferent ?? {},
              ),
              conventionId: acceptedByCounsellorConvention.id,
              internshipKind: acceptedByCounsellorConvention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .lastName,
              }),
              businessName: acceptedByCounsellorConvention.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
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
              agencyReferentName: getFormattedFirstnameAndLastname(
                acceptedByCounsellorConvention.agencyReferent ?? {},
              ),
              conventionId: acceptedByCounsellorConvention.id,
              internshipKind: acceptedByCounsellorConvention.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  acceptedByCounsellorConvention.signatories.beneficiary
                    .lastName,
              }),
              businessName: acceptedByCounsellorConvention.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkIds[1]),
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

    it("Sends notification email only to peAdvisor when beneficiary is PeConnected and beneficiary has PE advisor", async () => {
      uow.agencyRepository.agencies = [agencyWithValidatorsOnly];
      const shortLinkId = "shortlink1";
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

      const conventionAcceptedByCounsellorWithFtAdvisor =
        new ConventionDtoBuilder(defaultConvention)
          .withStatus("ACCEPTED_BY_COUNSELLOR")
          .withFederatedIdentity(ftIdentity)
          .build();

      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: {
          email: ftAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: ftIdentity.token,
        conventionId: conventionAcceptedByCounsellorWithFtAdvisor.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [userConventionAdvisor],
      );

      await notifyNewConventionNeedsReview.execute({
        convention: conventionAcceptedByCounsellorWithFtAdvisor,
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkId]: fakeGenerateMagicLinkUrlFn({
          id: conventionAcceptedByCounsellorWithFtAdvisor.id,
          role: "validator",
          targetRoute: frontRoutes.manageConvention,
          email: ftAdvisorEmail,
          now: timeGateway.now(),
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
            recipients: [ftAdvisorEmail],
            params: {
              agencyReferentName: getFormattedFirstnameAndLastname(
                conventionAcceptedByCounsellorWithFtAdvisor.agencyReferent ??
                  {},
              ),
              conventionId: conventionAcceptedByCounsellorWithFtAdvisor.id,
              internshipKind:
                conventionAcceptedByCounsellorWithFtAdvisor.internshipKind,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionAcceptedByCounsellorWithFtAdvisor.signatories
                    .beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionAcceptedByCounsellorWithFtAdvisor.signatories
                    .beneficiary.lastName,
              }),
              businessName:
                conventionAcceptedByCounsellorWithFtAdvisor.businessName,
              magicLink: makeShortLinkUrl(config, shortLinkId),
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
        ],
      });
    });
  });
});
