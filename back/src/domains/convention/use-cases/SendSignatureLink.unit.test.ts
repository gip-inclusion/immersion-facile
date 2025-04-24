import { afterEach } from "node:test";
import { subDays, subHours } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  type InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  type Notification,
  UserBuilder,
  conventionStatusesWithJustification,
  conventionStatusesWithValidator,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  type SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { makeShortLinkUrl } from "../../core/short-link/ShortLink";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  MIN_HOURS_BETWEEN_REMINDER,
  type SendSignatureLink,
  makeSendSignatureLink,
} from "./SendSignatureLink";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";

const convention = new ConventionDtoBuilder()
  .withId(conventionId)
  .withStatus("READY_TO_SIGN")
  .signedByEstablishmentRepresentative(undefined)
  .signedByBeneficiary(undefined)
  .withBeneficiarySignedAt(undefined)
  .build();

const agency = new AgencyDtoBuilder().withId(convention.agencyId).build();

const viewerJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "agency-viewer",
  email: "agency-viewer@mail.com",
  now: new Date(),
});

const notConnectedUser = new UserBuilder()
  .withEmail("validator@mail.com")
  .build();
const validatorJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "validator",
  email: notConnectedUser.email,
  now: new Date(),
});

const counsellorJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "counsellor",
  email: notConnectedUser.email,
  now: new Date(),
});

const connectedUserPayload: InclusionConnectDomainJwtPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
};

const connectedUserBuilder = new InclusionConnectedUserBuilder().withId(
  connectedUserPayload.userId,
);
const connectedUser = connectedUserBuilder.build();

const backofficeAdminPayload: InclusionConnectDomainJwtPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005263",
};

const backofficeAdminBuilder = new InclusionConnectedUserBuilder().withId(
  backofficeAdminPayload.userId,
);
const backofficeAdmin = backofficeAdminBuilder.withIsAdmin(true).build();

describe("Send signature link", () => {
  const config = new AppConfigBuilder().build();
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let usecase: SendSignatureLink;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      new UuidV4Generator(),
      timeGateway,
    );

    usecase = makeSendSignatureLink({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGeneratorGateway,
        config,
      },
    });
  });

  describe("Wrong paths", () => {
    afterEach(() => {
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, []);
      expectObjectInArrayToMatch(uow.outboxRepository.events, []);
    });

    it("throws bad request if requested convention does not match the one in jwt", async () => {
      const requestedConventionId = "1dd5c20e-6dd2-45af-affe-927358005250";

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: requestedConventionId,
            role: "beneficiary-representative",
          },
          validatorJwtPayload,
        ),
        errors.convention.forbiddenMissingRights({
          conventionId: requestedConventionId,
        }),
      );
    });

    it("throws not found if convention does not exist", async () => {
      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            role: "beneficiary-representative",
          },
          validatorJwtPayload,
        ),
        errors.convention.notFound({ conventionId }),
      );
    });

    it.each([
      "IN_REVIEW",
      ...conventionStatusesWithJustification,
      ...conventionStatusesWithValidator,
    ] as const)(
      "throws bad request if convention status %s does not allow send signature link",
      async (conventionStatus) => {
        const draftConvention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus(conventionStatus)
          .build();
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.conventionRepository.setConventions([draftConvention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: draftConvention.id,
              role: "beneficiary-representative",
            },
            validatorJwtPayload,
          ),
          errors.convention.sendSignatureLinkNotAllowedForStatus({
            status: draftConvention.status,
          }),
        );
      },
    );

    it("throws bad request if role to send signature link does not exist", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [notConnectedUser];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: convention.id,
            role: "beneficiary-current-employer",
          },
          validatorJwtPayload,
        ),
        errors.convention.missingActor({
          conventionId: convention.id,
          role: "beneficiary-current-employer",
        }),
      );
    });

    describe("from connected user", () => {
      it("throws not found if connected user id does not exist", async () => {
        const unexistingUserPayload: InclusionConnectDomainJwtPayload = {
          userId: "bcc5c20e-6dd2-45cf-affe-927358005267",
        };
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            unexistingUserPayload,
          ),
          errors.user.notFound(unexistingUserPayload),
        );
      });

      it("throws unauthorized if user has no rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.userRepository.users = [connectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            connectedUserPayload,
          ),
          errors.user.noRightsOnAgency({
            userId: connectedUserPayload.userId,
            agencyId: convention.agencyId,
          }),
        );
      });

      it("throws unauthorized if user has not enough rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUserPayload.userId]: {
              roles: ["agency-viewer"],
              isNotifiedByEmail: false,
            },
          }),
        ];
        uow.userRepository.users = [connectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            connectedUserPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            userId: connectedUserPayload.userId,
            agencyId: convention.agencyId,
          }),
        );
      });
    });

    describe("from magiclink", () => {
      it("throws unauthorized if role in payload is not allowed to send signature link", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            viewerJwtPayload,
          ),
          errors.convention.unsupportedRole({
            role: "agency-viewer",
          }),
        );
      });

      it("throws unauthorized if role in payload is valid but user has no actual rights on agency", async () => {
        uow.userRepository.users = [notConnectedUser];
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            validatorJwtPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            agencyId: agency.id,
          }),
        );
      });

      it("throws unauthorized if user has not enough rights on agency", async () => {
        uow.userRepository.users = [notConnectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["agency-viewer"],
              isNotifiedByEmail: false,
            },
          }),
        ];

        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            validatorJwtPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            agencyId: agency.id,
          }),
        );
      });
    });

    it(`throws too many requests if there was already a signature link sent less than ${MIN_HOURS_BETWEEN_REMINDER} hours before`, async () => {
      const shortLinkId = "link2";
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
      uow.conventionRepository.setConventions([convention]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];
      uow.userRepository.users = [notConnectedUser];
      uow.notificationRepository.notifications = [
        {
          id: "past-notification-id",
          createdAt: subHours(timeGateway.now(), 2).toISOString(),
          kind: "sms",
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
            userId: undefined,
          },
          templatedContent: {
            recipientPhone:
              convention.signatories.establishmentRepresentative.phone,
            kind: "ReminderForSignatories",
            params: {
              shortLink: makeShortLinkUrl(config, "shortLink"),
            },
          },
        },
      ];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            role: "establishment-representative",
          },
          validatorJwtPayload,
        ),
        errors.convention.smsSignatureLinkAlreadySent({
          signatoryRole: "establishment-representative",
          minHoursBetweenReminder: MIN_HOURS_BETWEEN_REMINDER,
        }),
      );
    });

    it.each([
      "+33555689727", // Métropole
      "+262269567890", // Mayotte
      "+590590123456", // Guadeloupe
      "+594594234567", // Guyane
      "+596596345678", // Martinique
      "+262262456789", // Réunion
      "+68940301010", //  Polynésie française
      "+687261234", // Nouvelle-Calédonie
      "+508412345", //Saint-Pierre-et-Miquelon
    ])(
      "throws bad request if phone number format %s is incorrect",
      async (phoneNumber) => {
        const shortLinkId = "link1";
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
        const conventionWithIncorrectPhoneFormat = new ConventionDtoBuilder(
          convention,
        )
          .withBeneficiaryPhone(phoneNumber)
          .build();
        uow.conventionRepository.setConventions([
          conventionWithIncorrectPhoneFormat,
        ]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
        ];
        uow.userRepository.users = [notConnectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary",
            },
            validatorJwtPayload,
          ),
          errors.convention.invalidMobilePhoneNumber({
            conventionId: conventionWithIncorrectPhoneFormat.id,
            signatoryRole: "beneficiary",
          }),
        );
      },
    );

    it("throws bad request if signatory has already signed", async () => {
      const conventionAlreadySigned = new ConventionDtoBuilder(convention)
        .withBeneficiaryPhone("+33600000000")
        .withBeneficiarySignedAt(new Date())
        .build();
      uow.conventionRepository.setConventions([conventionAlreadySigned]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      uow.userRepository.users = [notConnectedUser];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            role: "beneficiary",
          },
          validatorJwtPayload,
        ),
        errors.convention.signatoryAlreadySigned({
          conventionId: conventionAlreadySigned.id,
          signatoryRole: "beneficiary",
        }),
      );
    });
  });

  describe("Right paths: send signature link sms", () => {
    it.each(["validator", "counsellor"] as const)(
      "When pro connected %s triggers it",
      async (role) => {
        const shortLinkId = "link1";
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUser.id]: {
              roles: [role],
              isNotifiedByEmail: false,
            },
          }),
        ];
        uow.userRepository.users = [connectedUser];

        await usecase.execute(
          {
            conventionId,
            role: "establishment-representative",
          },
          connectedUserPayload,
        );

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkId]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.establishmentRepresentative.role,
            email: convention.signatories.establishmentRepresentative.email,
            now: timeGateway.now(),
            targetRoute: frontRoutes.conventionToSign,
            extraQueryParams: { mtm_source: "sms-signature-link" },
          }),
        });

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          { topic: "NotificationAdded" },
        ]);
        expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
          {
            kind: "sms",
            followedIds: {
              conventionId: convention.id,
              agencyId: convention.agencyId,
              establishmentSiret: convention.siret,
              userId: connectedUser.id,
            },
            templatedContent: {
              recipientPhone:
                convention.signatories.establishmentRepresentative.phone,
              kind: "ReminderForSignatories",
              params: {
                shortLink: makeShortLinkUrl(config, shortLinkId),
              },
            },
          },
        ]);
      },
    );

    it("When backoffice admin triggers it", async () => {
      const shortLinkId = "link1";
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

      uow.conventionRepository.setConventions([convention]);
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
      uow.userRepository.users = [backofficeAdmin];

      await usecase.execute(
        {
          conventionId,
          role: "establishment-representative",
        },
        backofficeAdminPayload,
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
      ]);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        {
          kind: "sms",
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
            userId: backofficeAdmin.id,
          },
          templatedContent: {
            recipientPhone:
              convention.signatories.establishmentRepresentative.phone,
            kind: "ReminderForSignatories",
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkId),
            },
          },
        },
      ]);
    });

    it.each(["validator", "counsellor"] as const)(
      "When not connected %s triggers it",
      async (role) => {
        const shortLinkId = "link1";
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: [role],
              isNotifiedByEmail: false,
            },
          }),
        ];
        uow.userRepository.users = [notConnectedUser];

        await usecase.execute(
          {
            conventionId,
            role: "establishment-representative",
          },
          role === "validator" ? validatorJwtPayload : counsellorJwtPayload,
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          { topic: "NotificationAdded" },
        ]);
        expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
          {
            kind: "sms",
            followedIds: {
              conventionId: convention.id,
              agencyId: convention.agencyId,
              establishmentSiret: convention.siret,
              userId: undefined,
            },
            templatedContent: {
              recipientPhone:
                convention.signatories.establishmentRepresentative.phone,
              kind: "ReminderForSignatories",
              params: {
                shortLink: makeShortLinkUrl(config, shortLinkId),
              },
            },
          },
        ]);
      },
    );

    it.each([
      "+33600000000", // metropole
      "+33785689727", // metropole
      "+262639000001", // Mayotte
      "+590690000001", // Guadeloupe
      "+590691282545", // Guadeloupe
      "+594694000001", // Guyane
      "+596696000001", // Martinique
      "+262692000001", // Réunion
      "+262693000001", // Réunion
      "+68987770076", // polynesie française
      "+687751234", // nouvelle calédonie
      "+681821234", // wallis et futuna
      "+508551234", // saint pierre et miquelon
    ])("for phone number %s", async (phoneNumber) => {
      const shortLinkId = "link1";
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
      const conventionWithCustomPhoneNumer = new ConventionDtoBuilder(
        convention,
      )
        .withBeneficiaryPhone(phoneNumber)
        .build();

      uow.conventionRepository.setConventions([conventionWithCustomPhoneNumer]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      uow.userRepository.users = [notConnectedUser];

      await usecase.execute(
        {
          conventionId,
          role: "beneficiary",
        },
        validatorJwtPayload,
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
      ]);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        {
          kind: "sms",
          followedIds: {
            conventionId: conventionWithCustomPhoneNumer.id,
            agencyId: conventionWithCustomPhoneNumer.agencyId,
            establishmentSiret: conventionWithCustomPhoneNumer.siret,
            userId: undefined,
          },
          templatedContent: {
            recipientPhone:
              conventionWithCustomPhoneNumer.signatories.beneficiary.phone,
            kind: "ReminderForSignatories",
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkId),
            },
          },
        },
      ]);
    });

    it(`send signature link if last signature link was sent more than ${MIN_HOURS_BETWEEN_REMINDER} hours ago`, async () => {
      const shortLinkId = "link2";
      const pastSmsNotification: Notification = {
        id: "past-notification-id",
        createdAt: subDays(timeGateway.now(), 2).toISOString(),
        kind: "sms",
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
          userId: connectedUser.id,
        },
        templatedContent: {
          recipientPhone:
            convention.signatories.establishmentRepresentative.phone,
          kind: "ReminderForSignatories",
          params: {
            shortLink: makeShortLinkUrl(config, shortLinkId),
          },
        },
      };
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
      uow.conventionRepository.setConventions([convention]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [connectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      uow.userRepository.users = [connectedUser];
      uow.notificationRepository.notifications = [pastSmsNotification];

      await usecase.execute(
        {
          conventionId,
          role: "establishment-representative",
        },
        connectedUserPayload,
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
      ]);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        pastSmsNotification,
        {
          kind: "sms",
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
            userId: connectedUser.id,
          },
          templatedContent: {
            recipientPhone:
              convention.signatories.establishmentRepresentative.phone,
            kind: "ReminderForSignatories",
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkId),
            },
          },
        },
      ]);
    });
  });
});
