import {
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoBuilder,
  EmailNotification,
  expectToEqual,
  frontRoutes,
  Role,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { expectEmailFinalValidationConfirmationMatchingConvention } from "../../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryShortLinkQuery } from "../../../../adapters/secondary/InMemoryShortLinkQuery";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { DeterministShortLinkIdGeneratorGateway } from "../../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { ShortLinkId } from "../../../core/ports/ShortLinkQuery";
import {
  makeSaveNotificationAndRelatedEvent,
  WithNotificationIdAndKind,
} from "../../../generic/notifications/entities/Notification";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";
import { NotifyAllActorsOfFinalConventionValidation } from "./NotifyAllActorsOfFinalConventionValidation";

const establishmentTutorEmail = "establishment-tutor@mail.com";
const establishmentRepresentativeEmail =
  "establishment-representativ@gmail.com";
const beneficiaryCurrentEmployerEmail = "current@employer.com";
const beneficiaryRepresentativeEmail = "beneficiary@representative.fr";
const peAdvisorEmail = "pe-advisor@pole-emploi.net";
const counsellorEmail = "counsellor@email.fr";
const validatorEmail = "myValidator@mail.com";
const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "beneficiary-representative",
  email: beneficiaryRepresentativeEmail,
  phone: "0665565432",
  firstName: "Bob",
  lastName: "L'éponge",
};
const currentEmployer: BeneficiaryCurrentEmployer = {
  businessName: "boss",
  role: "beneficiary-current-employer",
  email: beneficiaryCurrentEmployerEmail,
  phone: "001223344",
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

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId)
  .withValidatorEmails([validatorEmail])
  .withCounsellorEmails([counsellorEmail])
  .build();

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let notifyAllActorsOfFinalConventionValidation: NotifyAllActorsOfFinalConventionValidation;
  let config: AppConfig;
  let shortLinkIdGenerator: DeterministShortLinkIdGeneratorGateway;
  let shortLinkQuery: InMemoryShortLinkQuery;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    shortLinkIdGenerator = new DeterministShortLinkIdGeneratorGateway();
    shortLinkQuery = uow.shortLinkQuery;

    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    notifyAllActorsOfFinalConventionValidation =
      new NotifyAllActorsOfFinalConventionValidation(
        new InMemoryUowPerformer(uow),
        saveNotificationAndRelatedEvent,
        fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGenerator,
        config,
      );
  });

  describe("NotifyAllActorsOfFinalApplicationValidation sends confirmation email to all actors", () => {
    it("Notify Default actors: beneficiary, establishement tutor, agency counsellor, agency validator that convention is validate.", async () => {
      const actors: { role: Role; email: string; shortlinkId: ShortLinkId }[] =
        [
          {
            role: "beneficiary",
            email: validConvention.signatories.beneficiary.email,
            shortlinkId: `shortLinkId_0`,
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: `shortLinkId_1`,
          },
          {
            role: "counsellor",
            email: counsellorEmail,
            shortlinkId: `shortLinkId_5`,
          },
          {
            role: "validator",
            email: validatorEmail,
            shortlinkId: `shortLinkId_6`,
          },
        ];

      const agency = new AgencyDtoBuilder(defaultAgency).build();

      uow.agencyRepository.setAgencies([agency]);

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute(validConvention);

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

      expectToEqual(shortLinkQuery.getShortLinks(), expectedShorlinks);

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
          agency,
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
            shortlinkId: `shortLinkId_0`,
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: `shortLinkId_1`,
          },
          {
            role: "beneficiary-current-employer",
            email: beneficiaryCurrentEmployerEmail,
            shortlinkId: `shortLinkId_3`,
          },
          {
            role: "counsellor",
            email: counsellorEmail,
            shortlinkId: `shortLinkId_5`,
          },
          {
            role: "validator",
            email: validatorEmail,
            shortlinkId: `shortLinkId_6`,
          },
        ];
      const agency = new AgencyDtoBuilder(defaultAgency).build();

      uow.agencyRepository.setAgencies([agency]);

      const conventionWithBeneficiaryCurrentEmployer = new ConventionDtoBuilder(
        validConvention,
      )
        .withBeneficiaryCurrentEmployer(currentEmployer)
        .build();

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute(
        conventionWithBeneficiaryCurrentEmployer,
      );

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

      expectToEqual(shortLinkQuery.getShortLinks(), expectedShorlinks);

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
          agency,
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
            shortlinkId: `shortLinkId_0`,
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: `shortLinkId_1`,
          },
          {
            role: "beneficiary-representative",
            email: beneficiaryRepresentativeEmail,
            shortlinkId: `shortLinkId_2`,
          },

          {
            role: "counsellor",
            email: counsellorEmail,
            shortlinkId: `shortLinkId_5`,
          },
          {
            role: "validator",
            email: validatorEmail,
            shortlinkId: `shortLinkId_6`,
          },
        ];
      const agency = new AgencyDtoBuilder(defaultAgency).build();

      uow.agencyRepository.setAgencies([agency]);

      const conventionWithBeneficiaryCurrentEmployer = new ConventionDtoBuilder(
        validConvention,
      )
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .build();

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute(
        conventionWithBeneficiaryCurrentEmployer,
      );

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

      expectToEqual(shortLinkQuery.getShortLinks(), expectedShorlinks);

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
          agency,
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
            shortlinkId: `shortLinkId_0`,
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: `shortLinkId_1`,
          },
          {
            role: "establishment-tutor",
            email: establishmentTutorEmail,
            shortlinkId: `shortLinkId_2`,
          },
          {
            role: "counsellor",
            email: counsellorEmail,
            shortlinkId: `shortLinkId_5`,
          },
          {
            role: "validator",
            email: validatorEmail,
            shortlinkId: `shortLinkId_6`,
          },
        ];

      const agency = new AgencyDtoBuilder(defaultAgency).build();

      uow.agencyRepository.setAgencies([agency]);

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      const conventionWithDifferentEstablishmentTutorAndEstablishmentRepresentative =
        new ConventionDtoBuilder(validConvention)
          .withEstablishmentTutorEmail(establishmentTutorEmail)
          .build();

      await notifyAllActorsOfFinalConventionValidation.execute(
        conventionWithDifferentEstablishmentTutorAndEstablishmentRepresentative,
      );

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

      expectToEqual(shortLinkQuery.getShortLinks(), expectedShorlinks);

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
          agency,
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
            shortlinkId: `shortLinkId_0`,
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: `shortLinkId_1`,
          },
          {
            role: "counsellor",
            email: counsellorEmail,
            shortlinkId: `shortLinkId_5`,
          },
          {
            role: "validator",
            email: validatorEmail,
            shortlinkId: `shortLinkId_6`,
          },
          {
            role: "validator",
            email: peAdvisorEmail,
            shortlinkId: `shortLinkId_2`,
          },
        ];
      const userPeExternalId = "i-am-an-external-id";
      const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
        _entityName: "ConventionPoleEmploiAdvisor",
        advisor: {
          email: peAdvisorEmail,
          firstName: "Elsa",
          lastName: "Oldenburg",
          type: "CAPEMPLOI",
        },
        peExternalId: userPeExternalId,
        conventionId: validConvention.id,
      };

      uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
        [userConventionAdvisor],
      );

      const agency = new AgencyDtoBuilder(defaultAgency).build();

      uow.agencyRepository.setAgencies([agency]);

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute(validConvention);

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

      expectToEqual(shortLinkQuery.getShortLinks(), expectedShorlinks);

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
          agency,
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
            shortlinkId: `shortLinkId_0`,
          },
          {
            role: "establishment-representative",
            email: establishmentRepresentativeEmail,
            shortlinkId: `shortLinkId_1`,
          },
          {
            role: "counsellor",
            email: counsellorEmail,
            shortlinkId: `shortLinkId_5`,
          },
          {
            role: "validator",
            email: validatorEmail,
            shortlinkId: `shortLinkId_6`,
          },
        ];
      const userPeExternalId = "i-am-an-external-id";
      const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
        _entityName: "ConventionPoleEmploiAdvisor",
        advisor: undefined,
        peExternalId: userPeExternalId,
        conventionId: validConvention.id,
      };

      uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
        [userConventionAdvisor],
      );

      const agency = new AgencyDtoBuilder(defaultAgency).build();

      uow.agencyRepository.setAgencies([agency]);

      const shortlinkIds = actors.map((truc) => truc.shortlinkId);

      shortLinkIdGenerator.addMoreShortLinkIds(shortlinkIds);

      await notifyAllActorsOfFinalConventionValidation.execute(validConvention);

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

      expectToEqual(shortLinkQuery.getShortLinks(), expectedShorlinks);

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
          agency,
          validConvention,
          config,
          actor.shortlinkId,
        );
      });
    });
  });
});
