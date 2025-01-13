import {
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoBuilder,
  EmailNotification,
  InclusionConnectedUserBuilder,
  Role,
  ShortLinkId,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import { ConventionFtUserAdvisorEntity } from "../../../core/authentication/ft-connect/dto/FtConnect.dto";
import { expectEmailFinalValidationConfirmationMatchingConvention } from "../../../core/notifications/adapters/InMemoryNotificationRepository";
import {
  WithNotificationIdAndKind,
  makeSaveNotificationAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyAllActorsOfFinalConventionValidation } from "./NotifyAllActorsOfFinalConventionValidation";

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  const establishmentTutorEmail = "establishment-tutor@mail.com";
  const establishmentRepresentativeEmail =
    "establishment-representativ@gmail.com";
  const beneficiaryCurrentEmployerEmail = "current@employer.com";
  const beneficiaryRepresentativeEmail = "beneficiary@representative.fr";
  const peAdvisorEmail = "pe-advisor@pole-emploi.net";
  const counsellor = new InclusionConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@email.fr")
    .build();
  const validator = new InclusionConnectedUserBuilder()
    .withId("myValidator")
    .withEmail("myValidator@mail.com")
    .build();

  const beneficiaryRepresentative: BeneficiaryRepresentative = {
    role: "beneficiary-representative",
    email: beneficiaryRepresentativeEmail,
    phone: "+33665565432",
    firstName: "Bob",
    lastName: "L'éponge",
  };
  const currentEmployer: BeneficiaryCurrentEmployer = {
    businessName: "boss",
    role: "beneficiary-current-employer",
    email: beneficiaryCurrentEmployerEmail,
    phone: "+33611223344",
    firstName: "Harry",
    lastName: "Potter",
    job: "Magician",
    businessSiret: "01234567891234",
    businessAddress: "Rue des Bouchers 67065 Strasbourg",
  };
  const validConvention: ConventionDto = new ConventionDtoBuilder()
    .withEstablishmentTutorEmail(establishmentRepresentativeEmail)
    .withEstablishmentRepresentativeEmail(establishmentRepresentativeEmail)
    .build();

  const defaultAgency = AgencyDtoBuilder.create(
    validConvention.agencyId,
  ).build();

  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let notifyAllActorsOfFinalConventionValidation: NotifyAllActorsOfFinalConventionValidation;
  let config: AppConfig;
  let shortLinkIdGenerator: DeterministShortLinkIdGeneratorGateway;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    shortLinkIdGenerator = new DeterministShortLinkIdGeneratorGateway();

    notifyAllActorsOfFinalConventionValidation =
      new NotifyAllActorsOfFinalConventionValidation(
        new InMemoryUowPerformer(uow),
        makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
        fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGenerator,
        config,
      );

    uow.agencyRepository.agencies = [
      toAgencyWithRights(defaultAgency, {
        [counsellor.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    ];
    uow.userRepository.users = [counsellor, validator];
  });

  describe("NotifyAllActorsOfFinalApplicationValidation sends confirmation email to all actors", () => {
    it("Notify Default actors: beneficiary, establishement tutor, agency counsellor, agency validator that convention is validate.", async () => {
      const actors: { role: Role; email: string; shortlinkId: ShortLinkId }[] =
        [
          {
            role: "beneficiary",
            email: validConvention.signatories.beneficiary.email,
            shortlinkId: "shortLinkId_0",
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: "shortLinkId_1",
          },
          {
            role: "counsellor",
            email: counsellor.email,
            shortlinkId: "shortLinkId_5",
          },
          {
            role: "validator",
            email: validator.email,
            shortlinkId: "shortLinkId_6",
          },
        ];

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute({
        convention: validConvention,
      });

      const expectedShorlinks = actors.reduce(
        (a, actor) => ({
          ...a,
          [actor.shortlinkId]: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: actor.role,
            email: actor.email,
            now: timeGateway.now(),
            exp: timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365,
            targetRoute: frontRoutes.conventionDocument,
          }),
        }),
        {},
      );

      expectToEqual(uow.shortLinkQuery.getShortLinks(), expectedShorlinks);

      const emailNotifications =
        uow.notificationRepository.notifications.filter(
          (notification): notification is EmailNotification =>
            notification.kind === "email",
        );

      expect(uow.outboxRepository.events.map(({ payload }) => payload)).toEqual(
        emailNotifications.map(
          ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
        ),
      );
      expect(emailNotifications).toHaveLength(4);

      actors.forEach((actor, index) => {
        expectEmailFinalValidationConfirmationMatchingConvention(
          [actor.email],
          emailNotifications[index].templatedContent,
          defaultAgency,
          validConvention,
          config,
          actor.shortlinkId,
        );
      });
    });

    it("With beneficiary current employer", async () => {
      const actors: { role: Role; email: string; shortlinkId: ShortLinkId }[] =
        [
          {
            role: "beneficiary",
            email: validConvention.signatories.beneficiary.email,
            shortlinkId: "shortLinkId_0",
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: "shortLinkId_1",
          },
          {
            role: "beneficiary-current-employer",
            email: beneficiaryCurrentEmployerEmail,
            shortlinkId: "shortLinkId_3",
          },
          {
            role: "counsellor",
            email: counsellor.email,
            shortlinkId: "shortLinkId_5",
          },
          {
            role: "validator",
            email: validator.email,
            shortlinkId: "shortLinkId_6",
          },
        ];

      const conventionWithBeneficiaryCurrentEmployer = new ConventionDtoBuilder(
        validConvention,
      )
        .withBeneficiaryCurrentEmployer(currentEmployer)
        .build();

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute({
        convention: conventionWithBeneficiaryCurrentEmployer,
      });

      const expectedShorlinks = actors.reduce(
        (a, actor) => ({
          ...a,
          [actor.shortlinkId]: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: actor.role,
            email: actor.email,
            now: timeGateway.now(),
            exp: timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365,
            targetRoute: frontRoutes.conventionDocument,
          }),
        }),
        {},
      );

      expectToEqual(uow.shortLinkQuery.getShortLinks(), expectedShorlinks);

      const emailNotifications =
        uow.notificationRepository.notifications.filter(
          (notification): notification is EmailNotification =>
            notification.kind === "email",
        );

      expect(uow.outboxRepository.events.map(({ payload }) => payload)).toEqual(
        emailNotifications.map(
          ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
        ),
      );
      expect(emailNotifications).toHaveLength(5);

      actors.forEach((actor, index) => {
        expectEmailFinalValidationConfirmationMatchingConvention(
          [actor.email],
          emailNotifications[index].templatedContent,
          defaultAgency,
          conventionWithBeneficiaryCurrentEmployer,
          config,
          actor.shortlinkId,
        );
      });
    });

    it("With beneficiary representative", async () => {
      const actors: { role: Role; email: string; shortlinkId: ShortLinkId }[] =
        [
          {
            role: "beneficiary",
            email: validConvention.signatories.beneficiary.email,
            shortlinkId: "shortLinkId_0",
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: "shortLinkId_1",
          },
          {
            role: "beneficiary-representative",
            email: beneficiaryRepresentativeEmail,
            shortlinkId: "shortLinkId_2",
          },
          {
            role: "counsellor",
            email: counsellor.email,
            shortlinkId: "shortLinkId_5",
          },
          {
            role: "validator",
            email: validator.email,
            shortlinkId: "shortLinkId_6",
          },
        ];

      const conventionWithBeneficiaryCurrentEmployer = new ConventionDtoBuilder(
        validConvention,
      )
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .build();

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute({
        convention: conventionWithBeneficiaryCurrentEmployer,
      });

      const expectedShorlinks = actors.reduce(
        (a, actor) => ({
          ...a,
          [actor.shortlinkId]: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: actor.role,
            email: actor.email,
            now: timeGateway.now(),
            exp: timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365,
            targetRoute: frontRoutes.conventionDocument,
          }),
        }),
        {},
      );

      expectToEqual(uow.shortLinkQuery.getShortLinks(), expectedShorlinks);

      const emailNotifications =
        uow.notificationRepository.notifications.filter(
          (notification): notification is EmailNotification =>
            notification.kind === "email",
        );

      expect(uow.outboxRepository.events.map(({ payload }) => payload)).toEqual(
        emailNotifications.map(
          ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
        ),
      );
      expect(emailNotifications).toHaveLength(5);

      actors.forEach((actor, index) => {
        expectEmailFinalValidationConfirmationMatchingConvention(
          [actor.email],
          emailNotifications[index].templatedContent,
          defaultAgency,
          conventionWithBeneficiaryCurrentEmployer,
          config,
          actor.shortlinkId,
        );
      });
    });

    it("With different establishment tutor and establishment representative", async () => {
      const actors: { role: Role; email: string; shortlinkId: ShortLinkId }[] =
        [
          {
            role: "beneficiary",
            email: validConvention.signatories.beneficiary.email,
            shortlinkId: "shortLinkId_0",
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: "shortLinkId_1",
          },
          {
            role: "establishment-tutor",
            email: establishmentTutorEmail,
            shortlinkId: "shortLinkId_2",
          },
          {
            role: "counsellor",
            email: counsellor.email,
            shortlinkId: "shortLinkId_5",
          },
          {
            role: "validator",
            email: validator.email,
            shortlinkId: "shortLinkId_6",
          },
        ];

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      const conventionWithDifferentEstablishmentTutorAndEstablishmentRepresentative =
        new ConventionDtoBuilder(validConvention)
          .withEstablishmentTutorEmail(establishmentTutorEmail)
          .build();

      await notifyAllActorsOfFinalConventionValidation.execute({
        convention:
          conventionWithDifferentEstablishmentTutorAndEstablishmentRepresentative,
      });

      const expectedShorlinks = actors.reduce(
        (a, actor) => ({
          ...a,
          [actor.shortlinkId]: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: actor.role,
            email: actor.email,
            now: timeGateway.now(),
            exp: timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365,
            targetRoute: frontRoutes.conventionDocument,
          }),
        }),
        {},
      );

      expectToEqual(uow.shortLinkQuery.getShortLinks(), expectedShorlinks);

      const emailNotifications =
        uow.notificationRepository.notifications.filter(
          (notification): notification is EmailNotification =>
            notification.kind === "email",
        );

      expect(uow.outboxRepository.events.map(({ payload }) => payload)).toEqual(
        emailNotifications.map(
          ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
        ),
      );
      expect(emailNotifications).toHaveLength(5);

      actors.forEach((actor, index) => {
        expectEmailFinalValidationConfirmationMatchingConvention(
          [actor.email],
          emailNotifications[index].templatedContent,
          defaultAgency,
          conventionWithDifferentEstablishmentTutorAndEstablishmentRepresentative,
          config,
          actor.shortlinkId,
        );
      });
    });

    it("With PeConnect Federated identity: beneficiary, establishment representative, agency counsellor & validator, and dedicated advisor", async () => {
      const actors: { role: Role; email: string; shortlinkId: ShortLinkId }[] =
        [
          {
            role: "beneficiary",
            email: validConvention.signatories.beneficiary.email,
            shortlinkId: "shortLinkId_0",
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: "shortLinkId_1",
          },
          {
            role: "counsellor",
            email: counsellor.email,
            shortlinkId: "shortLinkId_5",
          },
          {
            role: "validator",
            email: validator.email,
            shortlinkId: "shortLinkId_6",
          },
          {
            role: "validator",
            email: peAdvisorEmail,
            shortlinkId: "shortLinkId_2",
          },
        ];
      const userPeExternalId = "i-am-an-external-id";
      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: {
          email: peAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: userPeExternalId,
        conventionId: validConvention.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [userConventionAdvisor],
      );

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute({
        convention: validConvention,
      });

      const expectedShorlinks = actors.reduce(
        (a, actor) => ({
          ...a,
          [actor.shortlinkId]: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: actor.role,
            email: actor.email,
            now: timeGateway.now(),
            exp: timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365,
            targetRoute: frontRoutes.conventionDocument,
          }),
        }),
        {},
      );

      expectToEqual(uow.shortLinkQuery.getShortLinks(), expectedShorlinks);

      const emailNotifications =
        uow.notificationRepository.notifications.filter(
          (notification): notification is EmailNotification =>
            notification.kind === "email",
        );

      expect(uow.outboxRepository.events.map(({ payload }) => payload)).toEqual(
        emailNotifications.map(
          ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
        ),
      );
      expect(emailNotifications).toHaveLength(5);

      actors.forEach((actor, index) => {
        expectEmailFinalValidationConfirmationMatchingConvention(
          [actor.email],
          emailNotifications[index].templatedContent,
          defaultAgency,
          validConvention,
          config,
          actor.shortlinkId,
        );
      });
    });

    it("With PeConnect Federated identity: beneficiary, establishment tutor, agency counsellor & validator, and no advisor", async () => {
      const actors: { role: Role; email: string; shortlinkId: ShortLinkId }[] =
        [
          {
            role: "beneficiary",
            email: validConvention.signatories.beneficiary.email,
            shortlinkId: "shortLinkId_0",
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: "shortLinkId_1",
          },
          {
            role: "counsellor",
            email: counsellor.email,
            shortlinkId: "shortLinkId_5",
          },
          {
            role: "validator",
            email: validator.email,
            shortlinkId: "shortLinkId_6",
          },
        ];
      const userPeExternalId = "i-am-an-external-id";
      const userConventionAdvisor: ConventionFtUserAdvisorEntity = {
        _entityName: "ConventionFranceTravailAdvisor",
        advisor: undefined,
        peExternalId: userPeExternalId,
        conventionId: validConvention.id,
      };

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [userConventionAdvisor],
      );

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute({
        convention: validConvention,
      });

      const expectedShorlinks = actors.reduce(
        (a, actor) => ({
          ...a,
          [actor.shortlinkId]: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: actor.role,
            email: actor.email,
            now: timeGateway.now(),
            exp: timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365,
            targetRoute: frontRoutes.conventionDocument,
          }),
        }),
        {},
      );

      expectToEqual(uow.shortLinkQuery.getShortLinks(), expectedShorlinks);

      const emailNotifications =
        uow.notificationRepository.notifications.filter(
          (notification): notification is EmailNotification =>
            notification.kind === "email",
        );

      expect(uow.outboxRepository.events.map(({ payload }) => payload)).toEqual(
        emailNotifications.map(
          ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
        ),
      );
      expect(emailNotifications).toHaveLength(4);

      actors.forEach((actor, index) => {
        expectEmailFinalValidationConfirmationMatchingConvention(
          [actor.email],
          emailNotifications[index].templatedContent,
          defaultAgency,
          validConvention,
          config,
          actor.shortlinkId,
        );
      });
    });
  });
});
