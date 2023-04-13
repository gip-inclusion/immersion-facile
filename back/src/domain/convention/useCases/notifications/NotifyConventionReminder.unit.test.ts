import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  conventionStatuses,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  GenericActor,
  isSignatoryRole,
  Role,
  splitCasesBetweenPassingAndFailing,
  TemplatedEmail,
} from "shared";

import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { ReminderKind } from "../../../core/eventsPayloads/ConventionReminderPayload";
import { TimeGateway } from "../../../core/ports/TimeGateway";

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
  let useCase: NotifyConventionReminder;
  let emailGateway: InMemoryEmailGateway;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    emailGateway = new InMemoryEmailGateway(timeGateway);
    uow = createInMemoryUow();
    useCase = new NotifyConventionReminder(
      new InMemoryUowPerformer(uow),
      emailGateway,
      timeGateway,
      fakeGenerateMagicLinkUrlFn,
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
      expectToEqual(emailGateway.getSentEmails(), []);
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
      expectToEqual(emailGateway.getSentEmails(), []);
    });
  });

  const [authorizedAgencyStatuses, forbiddenAgencyStatuses] =
    splitCasesBetweenPassingAndFailing(conventionStatuses, ["IN_REVIEW"]);

  describe("FirstReminderForAgency", () => {
    it.each(authorizedAgencyStatuses)(
      `Send email AGENCY_FIRST_REMINDER to counsellors and validators when status is '%s'`,
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

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        });

        //Assert
        expectToEqual(emailGateway.getSentEmails(), [
          makeAgencyFirstReminderEmail({
            email: councellor1Email,
            role: "counsellor",
            agency,
            convention,
            timeGateway,
          }),
          makeAgencyFirstReminderEmail({
            email: councellor2Email,
            role: "counsellor",
            agency,
            convention,
            timeGateway,
          }),
          makeAgencyFirstReminderEmail({
            email: validator1Email,
            role: "validator",
            agency,
            convention,
            timeGateway,
          }),
          makeAgencyFirstReminderEmail({
            email: validator2Email,
            role: "validator",
            agency,
            convention,
            timeGateway,
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
        expectToEqual(emailGateway.getSentEmails(), []);
      });
    });
  });

  describe("LastReminderForAgency", () => {
    it.each(authorizedAgencyStatuses)(
      "Send email AGENCY_LAST_REMINDER to counsellors and validators when status is '%s'",
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

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: "LastReminderForAgency",
        });

        //Assert
        expectToEqual(emailGateway.getSentEmails(), [
          makeAgencyLastReminderEmail({
            email: councellor1Email,
            role: "counsellor",
            agency,
            convention,
            timeGateway,
          }),
          makeAgencyLastReminderEmail({
            email: councellor2Email,
            role: "counsellor",
            agency,
            convention,
            timeGateway,
          }),
          makeAgencyLastReminderEmail({
            email: validator1Email,
            role: "validator",
            agency,
            convention,
            timeGateway,
          }),
          makeAgencyLastReminderEmail({
            email: validator2Email,
            role: "validator",
            agency,
            convention,
            timeGateway,
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
        expectToEqual(emailGateway.getSentEmails(), []);
      });
    });
  });

  const [authorizedSignatoryStatuses, forbiddenSignatoryStatuses] =
    splitCasesBetweenPassingAndFailing(conventionStatuses, [
      "PARTIALLY_SIGNED",
      "READY_TO_SIGN",
    ]);

  describe("FirstReminderForSignatories", () => {
    const type: ReminderKind = "FirstReminderForSignatories";

    it.each(authorizedSignatoryStatuses)(
      `Send email SIGNATORY_FIRST_REMINDER to signatories when status is '%s'`,
      async (status) => {
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

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: type,
        });

        //Assert
        expectToEqual(emailGateway.getSentEmails(), [
          ...Object.values(convention.signatories).map((signatory) =>
            makeSignatoriesFirstReminderEmail({
              actor: signatory,
              convention,
              timeGateway,
            }),
          ),
          makeSignatoriesFirstReminderEmail({
            actor: convention.establishmentTutor,
            convention,
            timeGateway,
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
            reminderKind: type,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, type),
          ),
        );
        expectToEqual(emailGateway.getSentEmails(), []);
      });
    });
  });

  describe("LastReminderForSignatories", () => {
    const type: ReminderKind = "LastReminderForSignatories";
    it.each(authorizedSignatoryStatuses)(
      `Send email LAST_FIRST_REMINDER to signatories when status is '%s'`,
      async (status) => {
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

        //Act
        await useCase.execute({
          conventionId: convention.id,
          reminderKind: type,
        });

        //Assert
        expectToEqual(emailGateway.getSentEmails(), [
          ...Object.values(convention.signatories).map((signatory) =>
            makeSignatoriesLastReminderEmail({
              actor: signatory,
              convention,
              timeGateway,
            }),
          ),
          makeSignatoriesLastReminderEmail({
            actor: convention.establishmentTutor,
            convention,
            timeGateway,
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
            reminderKind: type,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, type),
          ),
        );
        expectToEqual(emailGateway.getSentEmails(), []);
      });
    });
    // const type: ReminderType = "LastReminderForSignatories";
    // it.each(["PARTIALLY_SIGNED", "READY_TO_SIGN"] satisfies ConventionStatus[])(
    //   `Send email SIGNATORY_LAST_REMINDER to signatories when status is '%s'`,
    //   async (status) => {
    //     //Arrange
    //     const agency = new AgencyDtoBuilder().withId("agencyId").build();
    //     const convention = new ConventionDtoBuilder()
    //       .withAgencyId(agency.id)
    //       .withStatus(status)
    //       .build();
    //     uow.conventionRepository.setConventions({
    //       [convention.id]: convention,
    //     });
    //     uow.agencyRepository.setAgencies([agency]);
    //     //Act
    //     await useCase.execute({
    //       conventionId: convention.id,
    //       type,
    //     });
    //     //Assert
    //     expectToEqual(emailGateway.getSentEmails(), [
    //       ...Object.values(convention.signatories).map((signatory) =>
    //         makeSignatoriesFirstReminderEmail({
    //           actor: signatory,
    //           convention,
    //           timeGateway,
    //         }),
    //       ),
    //       makeSignatoriesLastReminderEmail({
    //         actor: convention.establishmentTutor,
    //         convention,
    //         timeGateway,
    //       }),
    //     ]);
    //   },
    // );
    // describe("Forbidden cases on convention bad status", () => {
    //   it.each([
    //     "CANCELLED",
    //     "DRAFT",
    //     "IN_REVIEW",
    //     "REJECTED",
    //     "ACCEPTED_BY_VALIDATOR",
    //     "ACCEPTED_BY_COUNSELLOR",
    //   ] satisfies ConventionStatus[])("status '%s'", async (status) => {
    //     //Arrange
    //     const agency = new AgencyDtoBuilder().withId("agencyId").build();
    //     const convention = new ConventionDtoBuilder()
    //       .withAgencyId(agency.id)
    //       .withStatus(status)
    //       .build();
    //     uow.conventionRepository.setConventions({
    //       [convention.id]: convention,
    //     });
    //     uow.agencyRepository.setAgencies([agency]);
    //     //Act & Assert
    //     await expectPromiseToFailWithError(
    //       useCase.execute({
    //         conventionId: convention.id,
    //         type,
    //       }),
    //       new ForbiddenError(
    //         forbiddenUnsupportedStatusMessage(convention, type),
    //       ),
    //     );
    //     expectToEqual(emailGateway.getSentEmails(), []);
    //   });
    // });
    // ================  MANAGE SMS =======================
    // it("For establishment representative by SMS if the beneficiary don't have valid GSM phone number.", async () => {
    //   await useCase.execute();
    //   expect(true).toBeFalsy();
    // });
    // it("For establishment tutor by SMS if the beneficiary and establishment representative don't have valid GSM phone number.", async () => {
    //   await useCase.execute();
    //   expect(true).toBeFalsy();
    // });
    // it("For legal representative by SMS if the beneficiary, establishment representative and establishment tutor don't have valid GSM phone number.", async () => {
    //   await useCase.execute();
    //   expect(true).toBeFalsy();
    // });
    // it("For current employer by SMS if the beneficiary, establishment representative, establishment and legal representative tutor don't have valid GSM phone number.", async () => {
    //   await useCase.execute();
    //   expect(true).toBeFalsy();
    // });
    // it("For every actors (including agency) by Email if there is no valid GSM phone number", async () => {
    //   await useCase.execute();
    //   expect(true).toBeFalsy();
    // });
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
});

const makeAgencyFirstReminderEmail = ({
  email,
  role,
  agency,
  convention,
  timeGateway,
}: {
  email: string;
  role: Role;
  agency: AgencyDto;
  convention: ConventionDto;
  timeGateway: CustomTimeGateway;
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
    agencyMagicLinkUrl: fakeGenerateMagicLinkUrlFn({
      id: convention.id,
      role,
      targetRoute: frontRoutes.manageConvention,
      email,
      now: timeGateway.now(),
    }),
  },
});

const makeAgencyLastReminderEmail = ({
  email,
  role,
  convention,
  timeGateway,
}: {
  email: string;
  role: Role;
  agency: AgencyDto;
  convention: ConventionDto;
  timeGateway: CustomTimeGateway;
}): TemplatedEmail => ({
  type: "AGENCY_LAST_REMINDER",
  recipients: [email],
  params: {
    beneficiaryFirstName: convention.signatories.beneficiary.firstName,
    beneficiaryLastName: convention.signatories.beneficiary.lastName,
    businessName: convention.businessName,
    agencyMagicLinkUrl: fakeGenerateMagicLinkUrlFn({
      id: convention.id,
      role,
      targetRoute: frontRoutes.manageConvention,
      email,
      now: timeGateway.now(),
    }),
  },
});

const makeSignatoriesFirstReminderEmail = ({
  actor,
  convention,
  timeGateway,
}: {
  actor: GenericActor<Role>;
  convention: ConventionDto;
  timeGateway: TimeGateway;
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
    magicLinkUrl: isSignatoryRole(actor.role)
      ? fakeGenerateMagicLinkUrlFn({
          id: convention.id,
          role: actor.role,
          targetRoute: frontRoutes.conventionToSign,
          email: actor.email,
          now: timeGateway.now(),
        })
      : undefined,
  },
});

const makeSignatoriesLastReminderEmail = ({
  actor,
  convention,
  timeGateway,
}: {
  actor: GenericActor<Role>;
  convention: ConventionDto;
  timeGateway: TimeGateway;
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
    magicLinkUrl: isSignatoryRole(actor.role)
      ? fakeGenerateMagicLinkUrlFn({
          id: convention.id,
          role: actor.role,
          targetRoute: frontRoutes.conventionToSign,
          email: actor.email,
          now: timeGateway.now(),
        })
      : undefined,
  },
});
