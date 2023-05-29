import {
  AbsoluteUrl,
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  conventionStatuses,
  EstablishmentRepresentative,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  GenericActor,
  Role,
  splitCasesBetweenPassingAndFailing,
  TemplatedEmail,
  TemplatedSms,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { DeterministShortLinkIdGeneratorGateway } from "../../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../core/eventBus/EventBus";
import { ReminderKind } from "../../../core/eventsPayloads/ConventionReminderPayload";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import { makeShortLinkUrl } from "../../../core/ShortLink";
import {
  EmailNotification,
  makeSaveNotificationAndRelatedEvent,
  SmsNotification,
  WithNotificationIdAndKind,
} from "../../../generic/notifications/entities/Notification";
import {
  forbiddenUnsupportedStatusMessage,
  NotifyConventionReminder,
  toSignatoriesSummary,
} from "./NotifyConventionReminder";
import {
  missingAgencyMessage,
  missingConventionMessage,
} from "./NotifyLastSigneeThatConventionHasBeenSigned";

describe("NotifyThatConventionStillNeedToBeSigned use case", () => {
  const establishmentRepresentativeWithoutMobilePhone: EstablishmentRepresentative =
    {
      email: "boss@mail.com",
      firstName: "lord",
      lastName: "voldemort",
      phone: "0188776666",
      role: "establishment-representative",
    };
  let useCase: NotifyConventionReminder;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let config: AppConfig;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    config = new AppConfigBuilder().build();
    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    uow = createInMemoryUow();
    createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      createNewEvent,
      uuidGenerator,
      timeGateway,
    );
    useCase = new NotifyConventionReminder(
      new InMemoryUowPerformer(uow),
      timeGateway,
      saveNotificationAndRelatedEvent,
      fakeGenerateMagicLinkUrlFn,
      shortLinkIdGeneratorGateway,
      config,
    );
  });

  describe("Wrong paths", () => {
    it("Missing convention", async () => {
      //Arrange
      const convention = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions({});

      //Act
      await expectPromiseToFailWithError(
        useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        }),
        new NotFoundError(missingConventionMessage(convention.id)),
      );

      //Assert
      expectSavedEmailsNotificationsToEqual([]);
    });

    it("Missing agency", async () => {
      //Arrange
      const convention = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions({
        [convention.id]: convention,
      });

      //Act
      await expectPromiseToFailWithError(
        useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        }),
        new NotFoundError(missingAgencyMessage(convention)),
      );

      //Assert
      expectSavedEmailsNotificationsToEqual([]);
    });
  });

  const [authorizedAgencyStatuses, forbiddenAgencyStatuses] =
    splitCasesBetweenPassingAndFailing(conventionStatuses, ["IN_REVIEW"]);

  describe("FirstReminderForAgency", () => {
    it.each(authorizedAgencyStatuses)(
      `Send email 'FirstReminderForAgency' to counsellors and validators when status is '%s'`,
      async (status) => {
        //Arrange
        const councellor1Email = "councellor1@email.com";
        const councellor2Email = "councellor2@email.com";
        const validator1Email = "validator1@email.com";
        const validator2Email = "validator2@email.com";
        const agency = new AgencyDtoBuilder()
          .withId("agencyId")
          .withCounsellorEmails([councellor1Email, councellor2Email])
          .withValidatorEmails([validator1Email, validator2Email])
          .build();

        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);
        const shortLinkIds = ["link1", "link2", "link3", "link4"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        });

        //Assert
        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "counsellor",
            targetRoute: frontRoutes.manageConvention,
            email: councellor1Email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "counsellor",
            targetRoute: frontRoutes.manageConvention,
            email: councellor2Email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
            email: validator1Email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
            email: validator2Email,
            now: timeGateway.now(),
          }),
        });
        expectSavedEmailsNotificationsToEqual([
          makeAgencyFirstReminderEmail({
            email: councellor1Email,
            agency,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
          }),
          makeAgencyFirstReminderEmail({
            email: councellor2Email,
            agency,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[1]),
          }),
          makeAgencyFirstReminderEmail({
            email: validator1Email,
            agency,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[2]),
          }),
          makeAgencyFirstReminderEmail({
            email: validator2Email,
            agency,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[3]),
          }),
        ]);
      },
    );

    describe("Forbidden cases on convention bad status", () => {
      it.each(forbiddenAgencyStatuses)("status '%s'", async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();
        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);

        const type: ReminderKind = "FirstReminderForAgency";

        //Act & Assert
        await expectPromiseToFailWithError(
          useCase.execute({
            conventionId: convention.id,
            reminderKind: type,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, type),
          ),
        );
        expectSavedEmailsNotificationsToEqual([]);
      });
    });
  });

  describe("LastReminderForAgency", () => {
    it.each(authorizedAgencyStatuses)(
      "Send email 'LastReminderForAgency' to counsellors and validators when status is '%s'",
      async (status) => {
        //Arrange
        const councellor1Email = "councellor1@email.com";
        const councellor2Email = "councellor2@email.com";
        const validator1Email = "validator1@email.com";
        const validator2Email = "validator2@email.com";
        const agency = new AgencyDtoBuilder()
          .withId("agencyId")
          .withCounsellorEmails([councellor1Email, councellor2Email])
          .withValidatorEmails([validator1Email, validator2Email])
          .build();
        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);
        const shortLinkIds = ["link1", "link2", "link3", "link4"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: "LastReminderForAgency",
        });

        //Assert
        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "counsellor",
            targetRoute: frontRoutes.manageConvention,
            email: councellor1Email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "counsellor",
            targetRoute: frontRoutes.manageConvention,
            email: councellor2Email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
            email: validator1Email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: "validator",
            targetRoute: frontRoutes.manageConvention,
            email: validator2Email,
            now: timeGateway.now(),
          }),
        });
        expectSavedEmailsNotificationsToEqual([
          makeAgencyLastReminderEmail({
            email: councellor1Email,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
          }),
          makeAgencyLastReminderEmail({
            email: councellor2Email,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[1]),
          }),
          makeAgencyLastReminderEmail({
            email: validator1Email,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[2]),
          }),
          makeAgencyLastReminderEmail({
            email: validator2Email,
            convention,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[3]),
          }),
        ]);
      },
    );

    describe("Forbidden cases on convention bad status", () => {
      it.each(forbiddenAgencyStatuses)("status '%s'", async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();
        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);

        const type: ReminderKind = "FirstReminderForAgency";
        //Act
        await expectPromiseToFailWithError(
          useCase.execute({
            conventionId: convention.id,
            reminderKind: type,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, type),
          ),
        );

        //Assert
        expectSavedEmailsNotificationsToEqual([]);
      });
    });
  });

  const [authorizedSignatoryStatuses, forbiddenSignatoryStatuses] =
    splitCasesBetweenPassingAndFailing(conventionStatuses, [
      "PARTIALLY_SIGNED",
      "READY_TO_SIGN",
    ]);

  describe("FirstReminderForSignatories", () => {
    const kind: ReminderKind = "FirstReminderForSignatories";

    it.each(authorizedSignatoryStatuses)(
      `Send email 'FirstReminderForSignatories' to signatories when status is '%s'.
          Convention with same establishment representative & tutor without mobile phone`,
      async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();
        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .withEstablishmentRepresentative(
            establishmentRepresentativeWithoutMobilePhone,
          )
          .withEstablishmentTutor({
            email: establishmentRepresentativeWithoutMobilePhone.email,
            firstName: establishmentRepresentativeWithoutMobilePhone.firstName,
            lastName: establishmentRepresentativeWithoutMobilePhone.lastName,
            job: "wizard",
            phone: establishmentRepresentativeWithoutMobilePhone.phone,
            role: "establishment-tutor",
          })
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);

        const shortLinkIds = ["link1", "link2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: kind,
        });

        //Assert
        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.beneficiary.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.beneficiary.email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.establishmentRepresentative.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.establishmentRepresentative.email,
            now: timeGateway.now(),
          }),
        });

        expectSavedEmailsNotificationsToEqual([
          makeSignatoriesFirstReminderEmail({
            actor: convention.signatories.beneficiary,
            convention,
            timeGateway,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
          }),
          makeSignatoriesFirstReminderEmail({
            actor: convention.signatories.establishmentRepresentative,
            convention,
            timeGateway,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[1]),
          }),
        ]);

        expectSentSmsToEqual([]);
      },
    );

    it.each(authorizedSignatoryStatuses)(
      `Send email and SMS 'FirstReminderForSignatories' to signatories when status is '%s'.
          Convention with different establishment representative & tutor.
          SMS are sent only for signatories that have not signed yet and have mobile phone.`,
      async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();

        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .withBeneficiaryPhone("0611223344")
          .withBeneficiarySignedAt(undefined)
          .withEstablishmentRepresentativePhone("0755667788")
          .withEstablishmentRepresentativeSignedAt(undefined)
          .withEstablishmentTutor({
            email: "tutor@email.com",
            firstName: "Obiwan",
            lastName: "Kenobi",
            job: "Jedi Master",
            phone: "0688997755",
            role: "establishment-tutor",
          })
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);

        const shortLinkIds = ["link1", "link2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: kind,
        });

        //Assert
        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.beneficiary.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.beneficiary.email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.establishmentRepresentative.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.establishmentRepresentative.email,
            now: timeGateway.now(),
          }),
        });

        expectSavedEmailsNotificationsToEqual([
          makeSignatoriesFirstReminderEmail({
            actor: convention.establishmentTutor,
            convention,
            timeGateway,
            shortLinkUrl: undefined,
          }),
        ]);
        expectSentSmsToEqual([
          {
            recipientPhone:
              "33" + convention.signatories.beneficiary.phone.substring(1),
            kind,
            params: { shortLink: makeShortLinkUrl(config, shortLinkIds[0]) },
          },
          {
            recipientPhone:
              "33" +
              convention.signatories.establishmentRepresentative.phone.substring(
                1,
              ),
            kind,
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkIds[1]),
            },
          },
        ]);
      },
    );

    it.each(authorizedSignatoryStatuses)(
      `Send email 'FirstReminderForSignatories' to signatories when status is '%s' and signatories have no mobile phones`,
      async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();

        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .withBeneficiaryPhone("0111223344")
          .withEstablishmentRepresentativePhone("0211223344")
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);

        const shortLinkIds = ["link1", "link2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: kind,
        });

        //Assert
        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.beneficiary.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.beneficiary.email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.establishmentRepresentative.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.establishmentRepresentative.email,
            now: timeGateway.now(),
          }),
        });

        expectSavedEmailsNotificationsToEqual([
          makeSignatoriesFirstReminderEmail({
            actor: convention.signatories.beneficiary,
            convention,
            timeGateway,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
          }),
          makeSignatoriesFirstReminderEmail({
            actor: convention.signatories.establishmentRepresentative,
            convention,
            timeGateway,
            shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[1]),
          }),
          makeSignatoriesFirstReminderEmail({
            actor: convention.establishmentTutor,
            convention,
            timeGateway,
            shortLinkUrl: undefined,
          }),
        ]);
      },
    );

    describe("Forbidden cases on convention bad status", () => {
      it.each(forbiddenSignatoryStatuses)("status '%s'", async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();
        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);

        //Act & Assert
        await expectPromiseToFailWithError(
          useCase.execute({
            conventionId: convention.id,
            reminderKind: kind,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, kind),
          ),
        );
        expectSavedEmailsNotificationsToEqual([]);
      });
    });
  });

  describe("LastReminderForSignatories", () => {
    const type: ReminderKind = "LastReminderForSignatories";
    it.each(authorizedSignatoryStatuses)(
      `Send email 'LastReminderForSignatories' to signatories when status is '%s'.
          Convention with same establishment representative & tutor`,
      async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();

        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .withEstablishmentRepresentative(
            establishmentRepresentativeWithoutMobilePhone,
          )
          .withEstablishmentTutor({
            email: establishmentRepresentativeWithoutMobilePhone.email,
            firstName: establishmentRepresentativeWithoutMobilePhone.firstName,
            lastName: establishmentRepresentativeWithoutMobilePhone.lastName,
            job: "wizard",
            phone: establishmentRepresentativeWithoutMobilePhone.phone,
            role: "establishment-tutor",
          })
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);
        const shortLinkIds = ["link1", "link2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: type,
        });

        //Assert
        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.beneficiary.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.beneficiary.email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.establishmentRepresentative.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.establishmentRepresentative.email,
            now: timeGateway.now(),
          }),
        });
        expectSavedEmailsNotificationsToEqual([
          makeSignatoriesLastReminderEmail({
            actor: convention.signatories.beneficiary,
            convention,
            shortlinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
          }),
          makeSignatoriesLastReminderEmail({
            actor: convention.signatories.establishmentRepresentative,
            convention,
            shortlinkUrl: makeShortLinkUrl(config, shortLinkIds[1]),
          }),
        ]);
      },
    );

    it.each(authorizedSignatoryStatuses)(
      `Send email 'LastReminderForSignatories' to signatories when status is '%s'.
          Convention with different establishment representative & tutor.
          SMS are sent only for signatories that have not signed yet and have mobile phone.`,
      async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();

        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .withEstablishmentRepresentativePhone("0611448866")
          .withEstablishmentRepresentativeSignedAt(undefined)
          .withEstablishmentTutor({
            email: "tutor@email.com",
            firstName: "Obiwan",
            lastName: "Kenobi",
            job: "Jedi Master",
            phone: "0688997755",
            role: "establishment-tutor",
          })
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);
        const shortLinkIds = ["link1", "link2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: type,
        });

        //Assert
        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkIds[0]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.beneficiary.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.beneficiary.email,
            now: timeGateway.now(),
          }),
          [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.establishmentRepresentative.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.establishmentRepresentative.email,
            now: timeGateway.now(),
          }),
        });
        expectSavedEmailsNotificationsToEqual([
          makeSignatoriesLastReminderEmail({
            actor: convention.signatories.beneficiary,
            convention,
            shortlinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
          }),
          makeSignatoriesLastReminderEmail({
            actor: convention.establishmentTutor,
            convention,
            shortlinkUrl: undefined,
          }),
        ]);
        expectSentSmsToEqual([
          {
            recipientPhone:
              "33" +
              convention.signatories.establishmentRepresentative.phone.substring(
                1,
              ),
            kind: type,
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkIds[1]),
            },
          },
        ]);
      },
    );

    describe("Forbidden cases on convention bad status", () => {
      it.each(forbiddenSignatoryStatuses)("status '%s'", async (status) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();
        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus(status)
          .build();
        uow.conventionRepository.setConventions({
          [convention.id]: convention,
        });
        uow.agencyRepository.setAgencies([agency]);

        //Act & Assert
        await expectPromiseToFailWithError(
          useCase.execute({
            conventionId: convention.id,
            reminderKind: type,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, type),
          ),
        );
        expectSavedEmailsNotificationsToEqual([]);
      });
    });
  });

  describe("toSignatoriesSummary", () => {
    it("should return the given text array if we only have a beneficiary and an establishment representative", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryFirstName("Jean")
        .withBeneficiaryLastName("Valjean")
        .withBeneficiarySignedAt(new Date("2023-03-15"))
        .withEstablishmentRepresentativeFirstName("Louis")
        .withEstablishmentRepresentativeLastName("de la Valière")
        .withEstablishmentRepresentativeSignedAt(undefined)
        .withBusinessName("Paris Corp")
        .build();

      const expected: string[] = [
        `- ✔️  - A signé le 15/03/2023 - Jean Valjean, bénéficiaire`,
        `- ❌ - N'a pas signé - Louis de la Valière, représentant l'entreprise Paris Corp`,
      ];

      expect(toSignatoriesSummary(convention)).toStrictEqual(expected);
    });

    it("should return the given text array if we have a minor beneficiary with a representative and an establishment representative", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryFirstName("Jean")
        .withBeneficiaryLastName("Valjean")
        .withBeneficiarySignedAt(new Date("2023-03-19"))
        .withEstablishmentRepresentativeFirstName("Louis")
        .withEstablishmentRepresentativeLastName("de la Valière")
        .withEstablishmentRepresentativeSignedAt(undefined)
        .withBusinessName("Paris Corp")
        .withBeneficiaryRepresentative({
          email: "",
          firstName: "Révérent",
          lastName: "Balec",
          phone: "",
          role: "beneficiary-representative",
          signedAt: new Date("2023-03-19").toDateString(),
        })
        .build();

      const expected: string[] = [
        `- ✔️  - A signé le 19/03/2023 - Jean Valjean, bénéficiaire`,
        `- ✔️  - A signé le 19/03/2023 - Révérent Balec, représentant légal du bénéficiaire`,
        `- ❌ - N'a pas signé - Louis de la Valière, représentant l'entreprise Paris Corp`,
      ];

      expect(toSignatoriesSummary(convention)).toStrictEqual(expected);
    });

    it("should return the given text array if we have a beneficiary with a current employer and an establishment representative", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryFirstName("Jean")
        .withBeneficiaryLastName("Valjean")
        .withBeneficiarySignedAt(new Date("2023-03-19"))
        .withEstablishmentRepresentativeFirstName("Louis")
        .withEstablishmentRepresentativeLastName("de la Valière")
        .withEstablishmentRepresentativeSignedAt(undefined)
        .withBusinessName("Paris Corp")
        .withBeneficiaryCurrentEmployer({
          email: "",
          firstName: "Robert",
          lastName: "Thénardier",
          phone: "",
          role: "beneficiary-current-employer",
          businessName: "",
          businessSiret: "",
          job: "",
          signedAt: undefined,
        })
        .build();

      const expected: string[] = [
        `- ✔️  - A signé le 19/03/2023 - Jean Valjean, bénéficiaire`,
        `- ❌ - N'a pas signé - Robert Thénardier, employeur actuel du bénéficiaire`,
        `- ❌ - N'a pas signé - Louis de la Valière, représentant l'entreprise Paris Corp`,
      ];

      expect(toSignatoriesSummary(convention)).toStrictEqual(expected);
    });
  });

  const expectSavedEmailsNotificationsToEqual = (
    expectedEmails: TemplatedEmail[],
  ) => {
    const emailNotifications = uow.notificationRepository.notifications.filter(
      (notification): notification is EmailNotification =>
        notification.kind === "email",
    );

    expectToEqual(
      emailNotifications.map(({ templatedContent }) => templatedContent),
      expectedEmails,
    );
    expectToEqual(
      uow.outboxRepository.events
        .filter(({ payload }) => (payload as any).kind === "email")
        .map(({ payload }) => payload),
      emailNotifications.map(
        ({ id, kind }): WithNotificationIdAndKind => ({ id, kind }),
      ),
    );
  };

  const expectSentSmsToEqual = (expectedSms: TemplatedSms[]) => {
    const smsNotifications = uow.notificationRepository.notifications.filter(
      (notification): notification is SmsNotification =>
        notification.kind === "sms",
    );
    expectToEqual(
      smsNotifications.map(({ templatedContent }) => templatedContent),
      expectedSms,
    );

    expectToEqual(
      uow.outboxRepository.events
        .filter(({ payload }) => (payload as any).kind === "sms")
        .map(({ payload }) => payload),
      smsNotifications.map(
        ({ id, kind }): WithNotificationIdAndKind => ({ id, kind }),
      ),
    );
  };
});

const makeAgencyFirstReminderEmail = ({
  email,
  agency,
  convention,
  shortLinkUrl,
}: {
  email: string;
  agency: AgencyDto;
  convention: ConventionDto;
  shortLinkUrl: AbsoluteUrl;
}): TemplatedEmail => ({
  type: "AGENCY_FIRST_REMINDER",
  recipients: [email],
  params: {
    agencyName: agency.name,
    beneficiaryFirstName: convention.signatories.beneficiary.firstName,
    beneficiaryLastName: convention.signatories.beneficiary.lastName,
    businessName: convention.businessName,
    dateStart: convention.dateStart,
    dateEnd: convention.dateEnd,
    agencyMagicLinkUrl: shortLinkUrl,
  },
});

const makeAgencyLastReminderEmail = ({
  email,
  convention,
  shortLinkUrl,
}: {
  email: string;
  convention: ConventionDto;
  shortLinkUrl: AbsoluteUrl;
}): TemplatedEmail => ({
  type: "AGENCY_LAST_REMINDER",
  recipients: [email],
  params: {
    beneficiaryFirstName: convention.signatories.beneficiary.firstName,
    beneficiaryLastName: convention.signatories.beneficiary.lastName,
    businessName: convention.businessName,
    agencyMagicLinkUrl: shortLinkUrl,
  },
});

const makeSignatoriesFirstReminderEmail = ({
  actor,
  convention,
  shortLinkUrl,
}: {
  actor: GenericActor<Role>;
  convention: ConventionDto;
  timeGateway: TimeGateway;
  shortLinkUrl: AbsoluteUrl | undefined;
}): TemplatedEmail => ({
  type: "SIGNATORY_FIRST_REMINDER",
  recipients: [actor.email],
  params: {
    actorFirstName: actor.firstName,
    actorLastName: actor.lastName,
    beneficiaryFirstName: convention.signatories.beneficiary.firstName,
    beneficiaryLastName: convention.signatories.beneficiary.lastName,
    businessName: convention.businessName,
    signatoriesSummary: toSignatoriesSummary(convention).join("\n"),
    magicLinkUrl: shortLinkUrl,
  },
});

const makeSignatoriesLastReminderEmail = ({
  actor,
  convention,
  shortlinkUrl,
}: {
  actor: GenericActor<Role>;
  convention: ConventionDto;
  shortlinkUrl: AbsoluteUrl | undefined;
}): TemplatedEmail => ({
  type: "SIGNATORY_LAST_REMINDER",
  recipients: [actor.email],
  params: {
    actorFirstName: actor.firstName,
    actorLastName: actor.lastName,
    beneficiaryFirstName: convention.signatories.beneficiary.firstName,
    beneficiaryLastName: convention.signatories.beneficiary.lastName,
    businessName: convention.businessName,
    signatoriesSummary: toSignatoriesSummary(convention).join("\n"),
    magicLinkUrl: shortlinkUrl,
  },
});
