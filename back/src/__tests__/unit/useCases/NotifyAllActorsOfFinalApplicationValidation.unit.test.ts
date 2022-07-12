import { parseISO } from "date-fns";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { PeConnectIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import {
  prettyPrintSchedule,
  reasonableSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { expectEmailFinalValidationConfirmationMatchingConvention } from "../../../_testBuilders/emailAssertions";
import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  getValidatedApplicationFinalConfirmationParams,
  NotifyAllActorsOfFinalApplicationValidation,
} from "../../../domain/convention/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../domain/peConnect/dto/PeConnect.dto";

const validConvention: ConventionDto = new ConventionDtoBuilder().build();

const counsellorEmail = "counsellor@email.fr";

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId).build();

describe("NotifyAllActorsOfFinalApplicationValidation sends confirmation email to all actors", () => {
  let uow: UnitOfWork;
  let emailGw: InMemoryEmailGateway;
  let agency: AgencyDto;
  let unitOfWorkPerformer: UnitOfWorkPerformer;

  beforeEach(() => {
    uow = createInMemoryUow();
    agency = defaultAgency;
    uow.agencyRepo = new InMemoryAgencyRepository([defaultAgency]);
    emailGw = new InMemoryEmailGateway();

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);
  });

  it("Default actors: beneficiary, mentor, agency counsellor", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    (uow.agencyRepo as InMemoryAgencyRepository).setAgencies([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalApplicationValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [validConvention.email, validConvention.mentorEmail, counsellorEmail],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("With PeConnect Federated identity: beneficiary, mentor, agency counsellor, and dedicated advisor", async () => {
    const userPeExternalId: PeConnectIdentity = `peConnect:i-am-an-external-id`;
    const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
      _entityName: "ConventionPoleEmploiAdvisor",
      conventionId: validConvention.id,
      email: "elsa.oldenburg@pole-emploi.net",
      firstName: "Elsa",
      lastName: "Oldenburg",
      userPeExternalId,
      type: "CAPEMPLOI",
    };

    (
      uow.conventionPoleEmploiAdvisorRepo as InMemoryConventionPoleEmploiAdvisorRepository
    ).setConventionPoleEmploiUsersAdvisor(userConventionAdvisor);

    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepo = new InMemoryAgencyRepository([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalApplicationValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        validConvention.email,
        validConvention.mentorEmail,
        counsellorEmail,
        userConventionAdvisor.email,
      ],
      sentEmails[0],
      agency,
      validConvention,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
  const agency = new AgencyDtoBuilder(defaultAgency)
    .withQuestionnaireUrl("testQuestionnaireUrl")
    .withSignature("testSignature")
    .build();

  it("simple application", () => {
    const application = new ConventionDtoBuilder()
      .withImmersionAddress("immersionAddress")
      .withSanitaryPrevention(true)
      .withSanitaryPreventionDescription("sanitaryPreventionDescription")
      .withIndividualProtection(true)
      .withSchedule(reasonableSchedule)
      .build();

    expectTypeToMatchAndEqual(
      getValidatedApplicationFinalConfirmationParams(agency, application),
      {
        totalHours: 70,
        beneficiaryFirstName: application.firstName,
        beneficiaryLastName: application.lastName,
        emergencyContact: application.emergencyContact,
        emergencyContactPhone: application.emergencyContactPhone,
        dateStart: parseISO(application.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(application.dateEnd).toLocaleDateString("fr"),
        mentorName: application.mentor,
        scheduleText: prettyPrintSchedule(application.schedule).split("\n"),
        businessName: application.businessName,
        immersionAddress: "immersionAddress",
        immersionAppellationLabel:
          application.immersionAppellation.appellationLabel,
        immersionActivities: application.immersionActivities,
        immersionSkills: application.immersionSkills ?? "Non renseigné",
        sanitaryPrevention: "sanitaryPreventionDescription",
        individualProtection: "oui",
        questionnaireUrl: agency.questionnaireUrl,
        signature: agency.signature,
        workConditions: application.workConditions,
      },
    );
  });

  it("prints correct sanitaryPreventionMessage when missing", () => {
    const application = new ConventionDtoBuilder()
      .withSanitaryPrevention(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agency,
      application,
    );

    expect(actualParms.sanitaryPrevention).toBe("non");
  });

  it("prints correct individualProtection when missing", () => {
    const application = new ConventionDtoBuilder()
      .withIndividualProtection(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agency,
      application,
    );

    expect(actualParms.individualProtection).toBe("non");
  });
});
