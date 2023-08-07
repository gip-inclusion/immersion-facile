import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  CreateConventionMagicLinkPayloadProperties,
  expectPromiseToFailWith,
  expectToEqual,
  frontRoutes,
  ModifierRole,
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
import { ShortLinkId } from "../../../core/ports/ShortLinkQuery";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import { makeShortLinkUrl } from "../../../core/ShortLink";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import {
  // backOfficeEmail,
  NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification,
} from "./NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";

const beneficiaryCurrentEmployerEmail = "current@employer.com";
const beneficiaryRepresentativeEmail = "beneficiary@representative.fr";

const convention = new ConventionDtoBuilder()
  .withBeneficiaryRepresentative({
    firstName: "Tom",
    lastName: "Cruise",
    phone: "0665454271",
    role: "beneficiary-representative",
    email: beneficiaryRepresentativeEmail,
  })
  .withBeneficiaryCurrentEmployer({
    businessName: "boss",
    role: "beneficiary-current-employer",
    email: beneficiaryCurrentEmployerEmail,
    phone: "001223344",
    firstName: "Harry",
    lastName: "Potter",
    job: "Magician",
    businessSiret: "01234567891234",
    businessAddress: "Rue des Bouchers 67065 Strasbourg",
  })
  .build();

const agency = new AgencyDtoBuilder()
  .withCounsellorEmails(["a@a.com", "b@b.com"])
  .withValidatorEmails(["c@c.com", "d@d.com"])
  .withId(convention.agencyId)
  .build();

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
    it.each<[Role, ModifierRole, string[]]>([
      ["beneficiary", "counsellor", agency.counsellorEmails],
      [
<<<<<<< HEAD
=======
        "establishment",
        "beneficiary-representative",
        [beneficiaryRepresentativeEmail],
      ],
      [
>>>>>>> 91c155dca (modify modification request in order to be able to send the notification to a specific actor back part)
        "establishment-representative",
        "legal-representative",
        [beneficiaryRepresentativeEmail],
      ],
      [
        "beneficiary-current-employer",
        "beneficiary",
        [convention.signatories.beneficiary.email],
      ],
      [
        "beneficiary-representative",
        "beneficiary-current-employer",
        [beneficiaryCurrentEmployerEmail],
      ],
      [
        "legal-representative",
        "establishment",
        [convention.signatories.establishmentRepresentative.email],
      ],
<<<<<<< HEAD
      ["beneficiary-current-employer", [beneficiaryCurrentEmployerEmail]],
      ["beneficiary-representative", [beneficiaryRepresentativeEmail]],
      ["counsellor", agency.counsellorEmails],
      ["validator", agency.validatorEmails],
      ["backOffice", [backOfficeEmail]],
=======
      ["counsellor", "legal-representative", [beneficiaryRepresentativeEmail]],
      ["validator", "validator", agency.validatorEmails],
      ["backOffice", "beneficiary", [convention.signatories.beneficiary.email]],
>>>>>>> 91c155dca (modify modification request in order to be able to send the notification to a specific actor back part)
    ])(
      "Notify %s that application needs modification.",
      async (role, modifierRole, expectedRecipients) => {
        shortLinkIdGateway.addMoreShortLinkIds(
          expectedRecipients.flatMap((expectedRecipient) => [
            `shortLinkId_${expectedRecipient}_1`,
            `shortLinkId_${expectedRecipient}_2`,
          ]),
        );
        const justification = "Change required.";

        await usecase.execute({
          convention,
          justification,
          role,
          modifierRole,
        });

        const shortLinks = expectedRecipients.reduce<
          Partial<Record<ShortLinkId, AbsoluteUrl>>
        >((prev, expectedRecipient, _) => {
          const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
            {
              id: convention.id,
              role,
              email: expectedRecipient,
              now: timeGateway.now(),
            };
          return {
            ...prev,
            [`shortLinkId_${expectedRecipient}_1`]: fakeGenerateMagicLinkUrlFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionImmersionRoute,
            }),
            [`shortLinkId_${expectedRecipient}_2`]: fakeGenerateMagicLinkUrlFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionStatusDashboard,
            }),
          };
        }, {});

        expectToEqual(uow.shortLinkQuery.getShortLinks(), shortLinks);

        expectSavedNotificationsAndEvents({
          emails: expectedRecipients.map((expectedRecipient) => ({
            kind: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
            recipients: [expectedRecipient],
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              justification,
              magicLink: makeShortLinkUrl(
                config,
                `shortLinkId_${expectedRecipient}_1`,
              ),
              conventionStatusLink: makeShortLinkUrl(
                config,
                `shortLinkId_${expectedRecipient}_2`,
              ),
              signature: agency.signature,
              agencyLogoUrl: agency.logoUrl,
            },
          })),
        });
      },
    );
  });

  describe("Wrong paths", () => {
    it("Agency without counsellors", async () => {
      const role: ModifierRole = "counsellor";
      const agencyWithoutCounsellors = new AgencyDtoBuilder(agency)
        .withCounsellorEmails([])
        .build();
      uow.agencyRepository.setAgencies([agencyWithoutCounsellors]);

      await expectPromiseToFailWith(
        usecase.execute({
          convention,
          justification: "OSEF",
          role,
          modifierRole: role,
        }),
        `No actor with role ${role} for agency ${agencyWithoutCounsellors.id}`,
      );
    });

    it("Agency without validators", async () => {
      const role: ModifierRole = "validator";
      const agencyWithoutValidators = new AgencyDtoBuilder(agency)
        .withValidatorEmails([])
        .build();
      uow.agencyRepository.setAgencies([agencyWithoutValidators]);

      await expectPromiseToFailWith(
        usecase.execute({
          convention,
          justification: "OSEF",
          role,
          modifierRole: role,
        }),
        `No actor with role ${role} for agency ${agencyWithoutValidators.id}`,
      );
    });
  });
});
