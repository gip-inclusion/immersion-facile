import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  CreateConventionMagicLinkPayloadProperties,
  Email,
  InclusionConnectedUserBuilder,
  ModifierRole,
  Role,
  ShortLinkId,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { ConventionRequiresModificationPayload } from "../../../core/events/eventPayload.dto";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { makeShortLinkUrl } from "../../../core/short-link/ShortLink";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyActorThatConventionNeedsModifications } from "./NotifyActorThatConventionNeedsModifications";

const beneficiaryCurrentEmployerEmail = "current@employer.com";
const beneficiaryRepresentativeEmail = "beneficiary@representative.fr";
const agencyActorEmail = "agency-actor@gmail.com";

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
    phone: "+33611223344",
    firstName: "Harry",
    lastName: "Potter",
    job: "Magician",
    businessSiret: "01234567891234",
    businessAddress: "Rue des Bouchers 67065 Strasbourg",
  })
  .build();

const agency = new AgencyDtoBuilder()

  .withId(convention.agencyId)
  .build();

const user = new InclusionConnectedUserBuilder()
  .withEmail(agencyActorEmail)
  .withId("agency-actor-id")
  .buildUser();

const counsellorUser = new InclusionConnectedUserBuilder()
  .withEmail("counsellor@mail.com")
  .withId("counsellor")
  .buildUser();

const validatorUser = new InclusionConnectedUserBuilder()
  .withEmail("validator@mail.com")
  .withId("validator")
  .buildUser();

describe("NotifyActorThatConventionNeedsModifications", () => {
  let usecase: NotifyActorThatConventionNeedsModifications;
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;
  let config: AppConfig;
  let shortLinkIdGateway: DeterministShortLinkIdGeneratorGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    uow = createInMemoryUow();
    uow.conventionRepository.setConventions([convention]);
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [user.id]: {
          isNotifiedByEmail: false,
          roles: ["counsellor", "validator"],
        },
        [validatorUser.id]: {
          isNotifiedByEmail: false,
          roles: ["validator"],
        },
        [counsellorUser.id]: {
          isNotifiedByEmail: false,
          roles: ["counsellor"],
        },
      }),
    ];
    uow.userRepository.users = [user, validatorUser, counsellorUser];
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

    usecase = new NotifyActorThatConventionNeedsModifications(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
      shortLinkIdGateway,
      config,
    );
  });

  describe("Right paths", () => {
    it.each<{
      requesterRole: Role;
      modifierRole: ModifierRole;
      email: Email[];
      requesterName: string;
    }>([
      {
        requesterRole: "beneficiary",
        modifierRole: "counsellor",
        email: [agencyActorEmail],
        requesterName: `${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName} (le bénéficiaire)`,
      },
      {
        requesterRole: "establishment-representative",
        modifierRole: "beneficiary-representative",
        email: [beneficiaryRepresentativeEmail],
        requesterName: `${convention.signatories.establishmentRepresentative.firstName} ${convention.signatories.establishmentRepresentative.lastName} (le représentant légal de l'entreprise)`,
      },
      {
        requesterRole: "establishment-representative",
        modifierRole: "beneficiary-representative",
        email: [beneficiaryRepresentativeEmail],
        requesterName: `${convention.signatories.establishmentRepresentative.firstName} ${convention.signatories.establishmentRepresentative.lastName} (le représentant légal de l'entreprise)`,
      },
      {
        requesterRole: "beneficiary-current-employer",
        modifierRole: "beneficiary",
        email: [convention.signatories.beneficiary.email],
        requesterName: `${convention.signatories.beneficiaryCurrentEmployer?.firstName} ${convention.signatories.beneficiaryCurrentEmployer?.lastName} (l'employeur actuel du bénéficiaire)`,
      },
      {
        requesterRole: "beneficiary-representative",
        modifierRole: "beneficiary-current-employer",
        email: [beneficiaryCurrentEmployerEmail],
        requesterName: `${convention.signatories.beneficiaryRepresentative?.firstName} ${convention.signatories.beneficiaryRepresentative?.lastName} (le représentant légal du bénéficiaire)`,
      },
      {
        requesterRole: "counsellor",
        modifierRole: "beneficiary-representative",
        email: [beneficiaryRepresentativeEmail],
        requesterName: agency.name,
      },
      {
        requesterRole: "validator",
        modifierRole: "validator",
        email: [agencyActorEmail],
        requesterName: agency.name,
      },
      {
        requesterRole: "back-office",
        modifierRole: "beneficiary",
        email: [convention.signatories.beneficiary.email],
        requesterName: "L'équipe Immersion Facilitée",
      },
    ])(
      "Notify $modifierRole that application needs modification.",
      async ({
        requesterRole,
        modifierRole,
        email: expectedRecipients,
        requesterName,
      }) => {
        shortLinkIdGateway.addMoreShortLinkIds(
          expectedRecipients.flatMap((expectedRecipient) => [
            `shortLinkId_${expectedRecipient}_1_${modifierRole}`,
          ]),
        );
        const justification = "Change required.";
        const requestModificationPayload: ConventionRequiresModificationPayload =
          {
            convention,
            justification,
            requesterRole,
            modifierRole,
            agencyActorEmail,
          };
        await usecase.execute(requestModificationPayload);

        const shortLinks = expectedRecipients.reduce<
          Partial<Record<ShortLinkId, AbsoluteUrl>>
        >((prev, expectedRecipient, _) => {
          const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
            {
              id: convention.id,
              role: modifierRole,
              email: expectedRecipient,
              now: timeGateway.now(),
            };
          return {
            ...prev,
            [`shortLinkId_${expectedRecipient}_1_${modifierRole}`]:
              fakeGenerateMagicLinkUrlFn({
                ...magicLinkCommonFields,
                targetRoute: frontRoutes.conventionImmersionRoute,
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
                `shortLinkId_${expectedRecipient}_1_${modifierRole}`,
              ),
              signature: agency.signature,
              agencyLogoUrl: agency.logoUrl ?? undefined,
              requesterName,
            },
          })),
        });
      },
    );
  });

  describe("Wrong paths", () => {
    it("throw when modifier role is beneficiary current employer and that is not defined in convention", async () => {
      const requesterRole: Role = "beneficiary";
      const modifierRole: ModifierRole = "beneficiary-current-employer";

      const conventionWithoutBeneficiaryCurrentEmployer =
        new ConventionDtoBuilder().build();

      await expectPromiseToFailWithError(
        usecase.execute({
          convention: conventionWithoutBeneficiaryCurrentEmployer,
          justification: "OSEF",
          requesterRole,
          modifierRole,
        }),
        new Error(
          `No actor with role ${modifierRole} for convention ${conventionWithoutBeneficiaryCurrentEmployer.id}`,
        ),
      );
    });

    it("throw when modifier role is beneficiary representative and that is not defined in convention", async () => {
      const requesterRole: Role = "beneficiary";
      const modifierRole: ModifierRole = "beneficiary-representative";

      const conventionWithoutBeneficiaryRepresentative =
        new ConventionDtoBuilder().build();

      await expectPromiseToFailWithError(
        usecase.execute({
          convention: conventionWithoutBeneficiaryRepresentative,
          justification: "OSEF",
          requesterRole,
          modifierRole,
        }),
        new Error(
          `No actor with role ${modifierRole} for convention ${conventionWithoutBeneficiaryRepresentative.id}`,
        ),
      );
    });
  });
});
