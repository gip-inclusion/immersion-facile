import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  EstablishmentRepresentative,
  GenericActor,
  InclusionConnectedUserBuilder,
  ReminderKind,
  Role,
  TemplatedEmail,
  conventionStatuses,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsBatchAndEvent,
  makeExpectSavedNotificationsBatchAndEvent,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { AgencyWithUsersRights } from "../../../agency/ports/AgencyRepository";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
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
import {
  NotifyConventionReminder,
  toSignatoriesSummary,
} from "./NotifyConventionReminder";

describe("NotifyThatConventionStillNeedToBeSigned use case", () => {
  const establishmentRepresentativeWithoutMobilePhone: EstablishmentRepresentative =
    {
      email: "boss@mail.com",
      firstName: "lord",
      lastName: "voldemort",
      phone: "+33188776666",
      role: "establishment-representative",
    };
  let useCase: NotifyConventionReminder;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let config: AppConfig;
  let expectSavedNotificationsBatchAndEvent: ExpectSavedNotificationsBatchAndEvent;

  beforeEach(() => {
    config = new AppConfigBuilder().build();
    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    uow = createInMemoryUow();
    const saveNotificationsBatchAndRelatedEvent =
      makeSaveNotificationsBatchAndRelatedEvent(uuidGenerator, timeGateway);

    expectSavedNotificationsBatchAndEvent =
      makeExpectSavedNotificationsBatchAndEvent(
        uow.notificationRepository,
        uow.outboxRepository,
      );

    useCase = new NotifyConventionReminder(
      new InMemoryUowPerformer(uow),
      timeGateway,
      saveNotificationsBatchAndRelatedEvent,
      fakeGenerateMagicLinkUrlFn,
      shortLinkIdGeneratorGateway,
      config,
    );
  });

  describe("Wrong paths", () => {
    it("Missing convention", async () => {
      //Arrange
      const convention = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions([]);

      //Act
      await expectPromiseToFailWithError(
        useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        }),
        errors.convention.notFound({ conventionId: convention.id }),
      );

      //Assert
      expectSavedNotificationsBatchAndEvent({
        emails: [],
      });
    });

    it("Missing agency", async () => {
      //Arrange
      const convention = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions([convention]);

      //Act
      await expectPromiseToFailWithError(
        useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        }),
        errors.agency.notFound({ agencyId: convention.agencyId }),
      );

      //Assert
      expectSavedNotificationsBatchAndEvent({
        emails: [],
      });
    });
  });

  describe("Agency reminders", () => {
    const [authorizedAgencyStatuses, forbiddenAgencyStatuses] =
      splitCasesBetweenPassingAndFailing(conventionStatuses, ["IN_REVIEW"]);

    const councellor1 = new InclusionConnectedUserBuilder()
      .withId("counsellor1")
      .withEmail("councellor1@email.com")
      .buildUser();
    const councellor2 = new InclusionConnectedUserBuilder()
      .withId("counsellor2")
      .withEmail("councellor2@email.com")
      .buildUser();
    const validator1 = new InclusionConnectedUserBuilder()
      .withId("validator1")
      .withEmail("validator1@email.com")
      .buildUser();
    const validator2 = new InclusionConnectedUserBuilder()
      .withId("validator2")
      .withEmail("validator2@email.com")
      .buildUser();
    const agencyWithRight = toAgencyWithRights(
      new AgencyDtoBuilder()
        .withId("agencyId")
        .withValidatorEmails([])
        .withCounsellorEmails([])
        .build(),
      {
        [councellor1.id]: {
          isNotifiedByEmail: false,
          roles: ["counsellor"],
        },
        [councellor2.id]: {
          isNotifiedByEmail: false,
          roles: ["counsellor"],
        },
        [validator1.id]: { isNotifiedByEmail: false, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: false, roles: ["validator"] },
      },
    );
    const shortLinkIds = ["link1", "link2", "link3", "link4"];

    beforeEach(() => {
      uow.userRepository.users = [
        councellor1,
        councellor2,
        validator1,
        validator2,
      ];
      uow.agencyRepository.setAgencies([agencyWithRight]);
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);
    });

    describe("FirstReminderForAgency", () => {
      it.each(authorizedAgencyStatuses)(
        `Send email 'FirstReminderForAgency' to counsellors and validators when status is '%s'`,
        async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

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
              email: councellor1.email,
              now: timeGateway.now(),
            }),
            [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: "counsellor",
              targetRoute: frontRoutes.manageConvention,
              email: councellor2.email,
              now: timeGateway.now(),
            }),
            [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: "validator",
              targetRoute: frontRoutes.manageConvention,
              email: validator1.email,
              now: timeGateway.now(),
            }),
            [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: "validator",
              targetRoute: frontRoutes.manageConvention,
              email: validator2.email,
              now: timeGateway.now(),
            }),
          });

          expectSavedNotificationsBatchAndEvent({
            emails: [
              makeAgencyFirstReminderEmail({
                email: councellor1.email,
                agency: agencyWithRight,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
              }),
              makeAgencyFirstReminderEmail({
                email: councellor2.email,
                agency: agencyWithRight,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[1]),
              }),
              makeAgencyFirstReminderEmail({
                email: validator1.email,
                agency: agencyWithRight,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[2]),
              }),
              makeAgencyFirstReminderEmail({
                email: validator2.email,
                agency: agencyWithRight,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[3]),
              }),
            ],
          });
        },
      );

      describe("Forbidden cases on convention bad status", () => {
        it.each(forbiddenAgencyStatuses)("status '%s'", async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const kind: ReminderKind = "FirstReminderForAgency";

          //Act & Assert
          await expectPromiseToFailWithError(
            useCase.execute({
              conventionId: convention.id,
              reminderKind: kind,
            }),
            errors.convention.forbiddenReminder({ convention, kind }),
          );
          expectSavedNotificationsBatchAndEvent({
            emails: [],
          });
        });
      });
    });

    describe("LastReminderForAgency", () => {
      it.each(authorizedAgencyStatuses)(
        "Send email 'LastReminderForAgency' to counsellors and validators when status is '%s'",
        async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

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
              email: councellor1.email,
              now: timeGateway.now(),
            }),
            [shortLinkIds[1]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: "counsellor",
              targetRoute: frontRoutes.manageConvention,
              email: councellor2.email,
              now: timeGateway.now(),
            }),
            [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: "validator",
              targetRoute: frontRoutes.manageConvention,
              email: validator1.email,
              now: timeGateway.now(),
            }),
            [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: "validator",
              targetRoute: frontRoutes.manageConvention,
              email: validator2.email,
              now: timeGateway.now(),
            }),
          });

          expectSavedNotificationsBatchAndEvent({
            emails: [
              makeAgencyLastReminderEmail({
                email: councellor1.email,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[0]),
              }),
              makeAgencyLastReminderEmail({
                email: councellor2.email,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[1]),
              }),
              makeAgencyLastReminderEmail({
                email: validator1.email,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[2]),
              }),
              makeAgencyLastReminderEmail({
                email: validator2.email,
                convention,
                shortLinkUrl: makeShortLinkUrl(config, shortLinkIds[3]),
              }),
            ],
          });
        },
      );

      describe("Forbidden cases on convention bad status", () => {
        it.each(forbiddenAgencyStatuses)("status '%s'", async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const kind: ReminderKind = "FirstReminderForAgency";
          //Act
          await expectPromiseToFailWithError(
            useCase.execute({
              conventionId: convention.id,
              reminderKind: kind,
            }),
            errors.convention.forbiddenReminder({ convention, kind }),
          );

          //Assert
          expectSavedNotificationsBatchAndEvent({
            emails: [],
          });
        });
      });
    });
  });

  describe("Signatories reminders", () => {
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
              firstName:
                establishmentRepresentativeWithoutMobilePhone.firstName,
              lastName: establishmentRepresentativeWithoutMobilePhone.lastName,
              job: "wizard",
              phone: establishmentRepresentativeWithoutMobilePhone.phone,
              role: "establishment-tutor",
            })
            .build();
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);

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

          expectSavedNotificationsBatchAndEvent({
            emails: [
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
            ],
            sms: [],
          });
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
            .withBeneficiaryPhone("+33611223344")
            .withBeneficiarySignedAt(undefined)
            .withEstablishmentRepresentativePhone("+33755667788")
            .withEstablishmentRepresentativeSignedAt(undefined)
            .withEstablishmentTutor({
              email: "tutor@email.com",
              firstName: "Obiwan",
              lastName: "Kenobi",
              job: "Jedi Master",
              phone: "+33688997755",
              role: "establishment-tutor",
            })
            .build();
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);

          const shortLinkIds = ["link1", "link2", "link3", "link4"];
          shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

          //Act
          await useCase.execute({
            conventionId: convention.id,
            reminderKind: kind,
          });

          //Assert
          const shortLinksInRepo = uow.shortLinkQuery.getShortLinks();
          expectToEqual(shortLinksInRepo, {
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
            [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: convention.signatories.beneficiary.role,
              targetRoute: frontRoutes.conventionToSign,
              email: convention.signatories.beneficiary.email,
              now: timeGateway.now(),
            }),
            [shortLinkIds[3]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: convention.signatories.establishmentRepresentative.role,
              targetRoute: frontRoutes.conventionToSign,
              email: convention.signatories.establishmentRepresentative.email,
              now: timeGateway.now(),
            }),
          });

          expectSavedNotificationsBatchAndEvent({
            emails: [
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
            ],
            sms: [
              {
                recipientPhone: convention.signatories.beneficiary.phone,
                kind,
                params: {
                  shortLink: makeShortLinkUrl(config, shortLinkIds[2]),
                },
              },
              {
                recipientPhone:
                  convention.signatories.establishmentRepresentative.phone,
                kind,
                params: {
                  shortLink: makeShortLinkUrl(config, shortLinkIds[3]),
                },
              },
            ],
          });
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
            .withBeneficiaryPhone("+33111223344")
            .withEstablishmentRepresentativePhone("+33211223344")
            .build();
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);

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

          expectSavedNotificationsBatchAndEvent({
            emails: [
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
            ],
          });
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
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);

          //Act & Assert
          await expectPromiseToFailWithError(
            useCase.execute({
              conventionId: convention.id,
              reminderKind: kind,
            }),
            errors.convention.forbiddenReminder({ convention, kind }),
          );
          expectSavedNotificationsBatchAndEvent({ emails: [] });
        });
      });
    });

    describe("LastReminderForSignatories", () => {
      const kind: ReminderKind = "LastReminderForSignatories";

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
              firstName:
                establishmentRepresentativeWithoutMobilePhone.firstName,
              lastName: establishmentRepresentativeWithoutMobilePhone.lastName,
              job: "wizard",
              phone: establishmentRepresentativeWithoutMobilePhone.phone,
              role: "establishment-tutor",
            })
            .build();
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);
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

          expectSavedNotificationsBatchAndEvent({
            emails: [
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
            ],
          });
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
            .withEstablishmentRepresentativePhone("+33611448866")
            .withEstablishmentRepresentativeSignedAt(undefined)
            .withEstablishmentTutor({
              email: "tutor@email.com",
              firstName: "Obiwan",
              lastName: "Kenobi",
              job: "Jedi Master",
              phone: "+33688997755",
              role: "establishment-tutor",
            })
            .build();
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);
          const shortLinkIds = ["link1", "link2", "link3"];
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
            [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
              id: convention.id,
              role: convention.signatories.establishmentRepresentative.role,
              targetRoute: frontRoutes.conventionToSign,
              email: convention.signatories.establishmentRepresentative.email,
              now: timeGateway.now(),
            }),
          });

          expectSavedNotificationsBatchAndEvent({
            emails: [
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
              makeSignatoriesLastReminderEmail({
                actor: convention.establishmentTutor,
                convention,
                shortlinkUrl: undefined,
              }),
            ],
            sms: [
              {
                recipientPhone:
                  convention.signatories.establishmentRepresentative.phone,
                kind,
                params: {
                  shortLink: makeShortLinkUrl(config, shortLinkIds[2]),
                },
              },
            ],
          });
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
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);

          //Act & Assert
          await expectPromiseToFailWithError(
            useCase.execute({
              conventionId: convention.id,
              reminderKind: kind,
            }),
            errors.convention.forbiddenReminder({ convention, kind }),
          );
          expectSavedNotificationsBatchAndEvent({});
        });
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
        "- √  - A signé le 15/03/2023 - Jean Valjean, bénéficiaire",
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
        "- √  - A signé le 19/03/2023 - Jean Valjean, bénéficiaire",
        "- √  - A signé le 19/03/2023 - Révérent Balec, représentant légal du bénéficiaire",
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
          businessAddress: "Rue des Bouchers 67065 Strasbourg",
        })
        .build();

      const expected: string[] = [
        "- √  - A signé le 19/03/2023 - Jean Valjean, bénéficiaire",
        `- ❌ - N'a pas signé - Robert Thénardier, employeur actuel du bénéficiaire`,
        `- ❌ - N'a pas signé - Louis de la Valière, représentant l'entreprise Paris Corp`,
      ];

      expect(toSignatoriesSummary(convention)).toStrictEqual(expected);
    });
  });

  describe("handle SMS DOM", () => {
    it.each([
      ["+33600000001"], // Metropole
      ["+262639000001"], // Mayotte
      ["+590690000001"], // Guadeloupe
      ["+590691000001"], // Guadeloupe
      ["+594694000001"], // Guyane
      ["+596696000001"], // Martinique
      ["+262692000001"], // Réunion
      ["+262693000001"], // Réunion
    ])(
      "Should send SMS with mobile phone %s",
      async (internationalMobilePhone) => {
        //Arrange
        const agency = new AgencyDtoBuilder().withId("agencyId").build();

        const convention = new ConventionDtoBuilder()
          .withAgencyId(agency.id)
          .withStatus("READY_TO_SIGN")
          .withBeneficiaryPhone(internationalMobilePhone)
          .withBeneficiarySignedAt(undefined)
          .withEstablishmentRepresentativePhone("+262693000002")
          .build();

        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.setAgencies([toAgencyWithRights(agency)]);

        const shortLinkIds = ["link1", "link2", "link3"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinkIds);

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForSignatories",
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
          [shortLinkIds[2]]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.signatories.beneficiary.role,
            targetRoute: frontRoutes.conventionToSign,
            email: convention.signatories.beneficiary.email,
            now: timeGateway.now(),
          }),
        });

        expectSavedNotificationsBatchAndEvent({
          emails: [
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
          ],
          sms: [
            {
              kind: "FirstReminderForSignatories",
              recipientPhone: internationalMobilePhone,
              params: {
                shortLink: makeShortLinkUrl(config, shortLinkIds[2]),
              },
            },
          ],
        });
      },
    );
  });
});

const makeAgencyFirstReminderEmail = ({
  email,
  agency,
  convention,
  shortLinkUrl,
}: {
  email: string;
  agency: AgencyWithUsersRights;
  convention: ConventionDto;
  shortLinkUrl: AbsoluteUrl;
}): TemplatedEmail => ({
  kind: "AGENCY_FIRST_REMINDER",
  recipients: [email],
  params: {
    conventionId: convention.id,
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
  kind: "AGENCY_LAST_REMINDER",
  recipients: [email],
  params: {
    conventionId: convention.id,
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
  kind: "SIGNATORY_FIRST_REMINDER",
  recipients: [actor.email],
  params: {
    conventionId: convention.id,
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
  kind: "SIGNATORY_LAST_REMINDER",
  recipients: [actor.email],
  params: {
    conventionId: convention.id,
    actorFirstName: actor.firstName,
    actorLastName: actor.lastName,
    beneficiaryFirstName: convention.signatories.beneficiary.firstName,
    beneficiaryLastName: convention.signatories.beneficiary.lastName,
    businessName: convention.businessName,
    signatoriesSummary: toSignatoriesSummary(convention).join("\n"),
    magicLinkUrl: shortlinkUrl,
  },
});
