import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  CreateConventionMagicLinkPayloadProperties,
  expectPromiseToFailWith,
  expectToEqual,
  frontRoutes,
  Role,
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
import { TimeGateway } from "../../../core/ports/TimeGateway";
import { makeShortLinkUrl } from "../../../core/ShortLink";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import {
  backOfficeEmail,
  NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification,
} from "./NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";

const convention = new ConventionDtoBuilder()
  .withBeneficiaryRepresentative({
    firstName: "Tom",
    lastName: "Cruise",
    phone: "0665454271",
    role: "beneficiary-representative",
    email: "beneficiary@representative.fr",
  })
  .withBeneficiaryCurrentEmployer({
    businessName: "boss",
    role: "beneficiary-current-employer",
    email: "current@employer.com",
    phone: "001223344",
    firstName: "Harry",
    lastName: "Potter",
    job: "Magician",
    businessSiret: "01234567891234",
    businessAddress: "Rue des Bouchers 67065 Strasbourg",
  })
  .build();

const agency = new AgencyDtoBuilder().withId(convention.agencyId).build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification", () => {
  let usecase: NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification;
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;
  let config: AppConfig;
  let shortLinkIdGateway: DeterministShortLinkIdGeneratorGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    uow = createInMemoryUow();
    uow.conventionRepository.setConventions({ [convention.id]: convention });
    uow.agencyRepository.setAgencies([agency]);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    timeGateway = new CustomTimeGateway();
    shortLinkIdGateway = new DeterministShortLinkIdGeneratorGateway();

    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    usecase =
      new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
        new InMemoryUowPerformer(uow),
        saveNotificationAndRelatedEvent,
        fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGateway,
        config,
      );
  });

  describe("Right paths", () => {
    it.each<[Role, string | undefined]>([
      ["beneficiary", convention.signatories.beneficiary.email],
      [
        "establishment",
        convention.signatories.establishmentRepresentative.email,
      ],
      [
        "establishment-representative",
        convention.signatories.establishmentRepresentative.email,
      ],
      [
        "beneficiary-current-employer",
        convention.signatories.beneficiaryCurrentEmployer?.email,
      ],
      [
        "beneficiary-representative",
        convention.signatories.beneficiaryRepresentative?.email,
      ],
      [
        "legal-representative",
        convention.signatories.beneficiaryRepresentative?.email,
      ],
      ["counsellor", agency.counsellorEmails[0]],
      ["validator", agency.validatorEmails[0]],
      ["backOffice", backOfficeEmail],
    ])(
      "Notify %s that application needs modification.",
      async (role, expectedRecipient) => {
        const shortLinkIds = ["shortLinkId1", "shortLinkId2"];
        shortLinkIdGateway.addMoreShortLinkIds(shortLinkIds);
        const justification = "Change required.";
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: convention.id,
            role,
            email: expectedRecipient!,
            now: timeGateway.now(),
          };

        await usecase.execute({
          convention,
          justification,
          roles: [role],
        });

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.conventionImmersionRoute,
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
        });

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
              recipients: [expectedRecipient!],
              params: {
                conventionId: convention.id,
                internshipKind: convention.internshipKind,
                beneficiaryFirstName:
                  convention.signatories.beneficiary.firstName,
                beneficiaryLastName:
                  convention.signatories.beneficiary.lastName,
                businessName: convention.businessName,
                justification,
                magicLink: makeShortLinkUrl(config, shortLinkIds[0]),
                conventionStatusLink: makeShortLinkUrl(config, shortLinkIds[1]),
                signature: agency.signature,
                agencyLogoUrl: agency.logoUrl,
              },
            },
          ],
        });
      },
    );
  });

  describe("Wrong paths", () => {
    it.each<Role>(["establishment-tutor"])(
      "Notify %s that application needs modification is not supported.",
      async (role) => {
        const justification = "Change required.";
        await expectPromiseToFailWith(
          usecase.execute({
            convention,
            justification,
            roles: [role],
          }),
          `Unsupported role for beneficiary/enterprise modification request notification: ${role}`,
        );
      },
    );
  });
});
