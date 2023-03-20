import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionStatus,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  Role,
  TemplatedEmail,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import { ReminderType } from "../../../core/eventsPayloads/ConventionSignReminderPayload";
import {
  missingAgencyMessage,
  missingConventionMessage,
} from "./NotifyLastSigneeThatConventionHasBeenSigned";
import {
  forbiddenUnsupportedStatusMessage,
  NotifyThatConventionStillNeedToBeSigned,
} from "./NotifyThatConventionStillNeedToBeSigned";

describe("NotifyThatConventionStillNeedToBeSigned use case", () => {
  let useCase: NotifyThatConventionStillNeedToBeSigned;
  let emailGateway: InMemoryEmailGateway;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    emailGateway = new InMemoryEmailGateway(timeGateway);
    uow = createInMemoryUow();
    useCase = new NotifyThatConventionStillNeedToBeSigned(
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
          type: "FirstReminderForAgency",
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
          type: "FirstReminderForAgency",
        }),
        new NotFoundError(missingAgencyMessage(convention)),
      );

      //Assert
      expectToEqual(emailGateway.getSentEmails(), []);
    });
  });

  describe("FirstReminderForAgency", () => {
    it("Send email FIRST_REMINDER_FOR_AGENCY to counsellor", async () => {
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
        .withStatus("IN_REVIEW")
        .build();
      uow.conventionRepository.setConventions({ [convention.id]: convention });
      uow.agencyRepository.setAgencies([agency]);

      //Act
      await useCase.execute({
        conventionId: convention.id,
        type: "FirstReminderForAgency",
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
    });

    it.each([
      "CANCELLED",
      "DRAFT",
      "PARTIALLY_SIGNED",
      "READY_TO_SIGN",
      "REJECTED",
      "ACCEPTED_BY_VALIDATOR",
      "ACCEPTED_BY_COUNSELLOR",
    ] satisfies ConventionStatus[])(
      "Forbidden : bad convention status %s.",
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

        const type: ReminderType = "FirstReminderForAgency";
        //Act
        await expectPromiseToFailWithError(
          useCase.execute({
            conventionId: convention.id,
            type,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, type),
          ),
        );

        //Assert
        expectToEqual(emailGateway.getSentEmails(), []);
      },
    );
  });

  describe("LastReminderForAgency", () => {
    it("Send email AGENCY_LAST_REMINDER to counsellors and validators", async () => {
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
        .withStatus("IN_REVIEW")
        .build();
      uow.conventionRepository.setConventions({ [convention.id]: convention });
      uow.agencyRepository.setAgencies([agency]);

      //Act
      await useCase.execute({
        conventionId: convention.id,
        type: "LastReminderForAgency",
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
    });

    it.each([
      "CANCELLED",
      "DRAFT",
      "PARTIALLY_SIGNED",
      "READY_TO_SIGN",
      "REJECTED",
      "ACCEPTED_BY_VALIDATOR",
      "ACCEPTED_BY_COUNSELLOR",
    ] satisfies ConventionStatus[])(
      "Forbidden : bad convention status %s.",
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

        const type: ReminderType = "FirstReminderForAgency";
        //Act
        await expectPromiseToFailWithError(
          useCase.execute({
            conventionId: convention.id,
            type,
          }),
          new ForbiddenError(
            forbiddenUnsupportedStatusMessage(convention, type),
          ),
        );

        //Assert
        expectToEqual(emailGateway.getSentEmails(), []);
      },
    );
  });

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
