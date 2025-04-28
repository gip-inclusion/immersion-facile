import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { makeShortLinkUrl } from "../../../core/short-link/ShortLink";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  NO_JUSTIFICATION,
  NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification,
} from "./NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification";

describe("NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification", () => {
  let useCase: NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification;
  let config: AppConfig;
  let shortLinkGenerator: DeterministShortLinkIdGeneratorGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    shortLinkGenerator = new DeterministShortLinkIdGeneratorGateway();

    uow = createInMemoryUow();
    const uuidGenerator = new UuidV4Generator();
    timeGateway = new CustomTimeGateway(new Date());
    useCase =
      new NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification(
        new InMemoryUowPerformer(uow),
        timeGateway,
        shortLinkGenerator,
        config,
        makeSaveNotificationAndRelatedEvent(uuidGenerator, timeGateway),
        fakeGenerateMagicLinkUrlFn,
      );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  describe("Right paths", () => {
    const agency = new AgencyDtoBuilder().build();
    const shortLinks = ["shortLink1", "shortLink2", "shortLink3", "shortLink4"];

    beforeEach(() => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
      shortLinkGenerator.addMoreShortLinkIds(shortLinks);
    });

    it("Convention with minimal signatories", async () => {
      const justification = "justif";
      const convention = new ConventionDtoBuilder()
        .withAgencyId(agency.id)
        .withStatusJustification(justification)
        .build();
      uow.conventionRepository.setConventions([convention]);

      await useCase.execute({ convention });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinks[0]]: fakeGenerateMagicLinkUrlFn({
          id: convention.id,
          role: convention.signatories.beneficiary.role,
          email: convention.signatories.beneficiary.email,
          now: timeGateway.now(),
          targetRoute: frontRoutes.conventionToSign,
          extraQueryParams: {
            mtm_source: "email-signature-link-after-modification",
          },
        }),
        [shortLinks[1]]: fakeGenerateMagicLinkUrlFn({
          id: convention.id,
          role: convention.signatories.establishmentRepresentative.role,
          email: convention.signatories.establishmentRepresentative.email,
          now: timeGateway.now(),
          targetRoute: frontRoutes.conventionToSign,
          extraQueryParams: {
            mtm_source: "email-signature-link-after-modification",
          },
        }),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [convention.signatories.beneficiary.email],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[0]),
              internshipKind: convention.internshipKind,
              justification,
              signatoryFirstName: convention.signatories.beneficiary.firstName,
              signatoryLastName: convention.signatories.beneficiary.lastName,
            },
          },
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [
              convention.signatories.establishmentRepresentative.email,
            ],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[1]),
              internshipKind: convention.internshipKind,
              justification,
              signatoryFirstName:
                convention.signatories.establishmentRepresentative.firstName,
              signatoryLastName:
                convention.signatories.establishmentRepresentative.lastName,
            },
          },
        ],
      });
    });

    it("Convention without justification", async () => {
      const convention = new ConventionDtoBuilder()
        .withAgencyId(agency.id)
        .build();
      uow.conventionRepository.setConventions([convention]);

      await useCase.execute({ convention });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [convention.signatories.beneficiary.email],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[0]),
              internshipKind: convention.internshipKind,
              justification: NO_JUSTIFICATION,
              signatoryFirstName: convention.signatories.beneficiary.firstName,
              signatoryLastName: convention.signatories.beneficiary.lastName,
            },
          },
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [
              convention.signatories.establishmentRepresentative.email,
            ],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[1]),
              internshipKind: convention.internshipKind,
              justification: NO_JUSTIFICATION,
              signatoryFirstName:
                convention.signatories.establishmentRepresentative.firstName,
              signatoryLastName:
                convention.signatories.establishmentRepresentative.lastName,
            },
          },
        ],
      });
    });

    it("Convention with all signatories", async () => {
      const justification = "justif";
      const convention = new ConventionDtoBuilder()
        .withAgencyId(agency.id)
        .withStatusJustification(justification)
        .withBeneficiaryRepresentative({
          firstName: "benef rep first name",
          lastName: "benef rep last name",
          email: "benefrep@email.com",
          phone: "0600558877",
          role: "beneficiary-representative",
        })
        .withBeneficiaryCurrentEmployer({
          firstName: "benef cur emp first name",
          lastName: "benef cur emp last name",
          email: "benefcuremp@email.com",
          phone: "0600777777",
          businessAddress: "13 rue de la soif, 60666 Quimper",
          businessName: "Merguez Corp",
          businessSiret: "77884455998877",
          job: "Lanceur de guezmer",
          role: "beneficiary-current-employer",
        })
        .build();
      uow.conventionRepository.setConventions([convention]);

      await useCase.execute({ convention });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [convention.signatories.beneficiary.email],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[0]),
              internshipKind: convention.internshipKind,
              justification,
              signatoryFirstName: convention.signatories.beneficiary.firstName,
              signatoryLastName: convention.signatories.beneficiary.lastName,
            },
          },
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [
              convention.signatories.establishmentRepresentative.email,
            ],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[1]),
              internshipKind: convention.internshipKind,
              justification,
              signatoryFirstName:
                convention.signatories.establishmentRepresentative.firstName,
              signatoryLastName:
                convention.signatories.establishmentRepresentative.lastName,
            },
          },
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [
              // biome-ignore lint/style/noNonNullAssertion:
              convention.signatories.beneficiaryRepresentative!.email,
            ],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[2]),
              internshipKind: convention.internshipKind,
              justification,
              signatoryFirstName:
                // biome-ignore lint/style/noNonNullAssertion:
                convention.signatories.beneficiaryRepresentative!.firstName,
              signatoryLastName:
                // biome-ignore lint/style/noNonNullAssertion:
                convention.signatories.beneficiaryRepresentative!.lastName,
            },
          },
          {
            kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
            recipients: [
              // biome-ignore lint/style/noNonNullAssertion:
              convention.signatories.beneficiaryCurrentEmployer!.email,
            ],
            params: {
              agencyLogoUrl: agency.logoUrl ?? undefined,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              conventionSignShortlink: makeShortLinkUrl(config, shortLinks[3]),
              internshipKind: convention.internshipKind,
              justification,
              signatoryFirstName:
                // biome-ignore lint/style/noNonNullAssertion:
                convention.signatories.beneficiaryCurrentEmployer!.firstName,

              signatoryLastName:
                // biome-ignore lint/style/noNonNullAssertion:
                convention.signatories.beneficiaryCurrentEmployer!.lastName,
            },
          },
        ],
      });
    });
  });

  describe("Wrong paths", () => {
    it("Convention missing", async () => {
      const convention = new ConventionDtoBuilder().build();
      uow.agencyRepository.agencies = [
        toAgencyWithRights(new AgencyDtoBuilder().build()),
      ];

      await expectPromiseToFailWithError(
        useCase.execute({ convention }),
        errors.convention.notFound({ conventionId: convention.id }),
      );

      await expectSavedNotificationsAndEvents({});
    });

    it("Agency missing", async () => {
      const convention = new ConventionDtoBuilder().build();
      const agency = new AgencyDtoBuilder().build();
      uow.conventionRepository.setConventions([
        new ConventionDtoBuilder(convention).withAgencyId(agency.id).build(),
      ]);

      await expectPromiseToFailWithError(
        useCase.execute({ convention }),
        errors.agency.notFound({ agencyId: convention.agencyId }),
      );

      await expectSavedNotificationsAndEvents({});
    });
  });
});
