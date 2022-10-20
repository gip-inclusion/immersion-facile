import { parseISO } from "date-fns";
import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  PeConnectIdentity,
  prettyPrintSchedule,
  reasonableSchedule,
  expectTypeToMatchAndEqual,
} from "shared";
import { expectEmailFinalValidationConfirmationMatchingConvention } from "../../../../_testBuilders/emailAssertions";

import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import {
  getValidatedConventionFinalConfirmationParams,
  NotifyAllActorsOfFinalConventionValidation,
} from "./NotifyAllActorsOfFinalConventionValidation";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";

const establishmentTutorEmail = "boss@mail.com";
const validConvention: ConventionDto = new ConventionDtoBuilder()
  .withEstablishmentTutorEmail(establishmentTutorEmail)
  .withEstablishmentRepresentativeEmail(establishmentTutorEmail)
  .build();

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
    uow.agencyRepository = new InMemoryAgencyRepository([defaultAgency]);
    emailGw = new InMemoryEmailGateway();

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);
  });

  it("Default actors: beneficiary, establishement tutor, agency counsellor", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    (uow.agencyRepository as InMemoryAgencyRepository).setAgencies([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalConventionValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        validConvention.signatories.beneficiary.email,
        validConvention.signatories.establishmentRepresentative.email,
        counsellorEmail,
      ],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("With different establishment tutor and establishment representative", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    (uow.agencyRepository as InMemoryAgencyRepository).setAgencies([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    const conventionWithSpecificEstablishementEmail = new ConventionDtoBuilder()
      .withEstablishmentTutorEmail(establishmentTutorEmail)
      .build();
    await new NotifyAllActorsOfFinalConventionValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(conventionWithSpecificEstablishementEmail);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        conventionWithSpecificEstablishementEmail.signatories.beneficiary.email,
        conventionWithSpecificEstablishementEmail.signatories
          .establishmentRepresentative.email,
        counsellorEmail,
        conventionWithSpecificEstablishementEmail.establishmentTutor.email,
      ],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("With a legal representative", async () => {
    const conventionWithBeneficiaryRepresentative = new ConventionDtoBuilder()
      .withBeneficiaryRepresentative({
        firstName: "Tom",
        lastName: "Cruise",
        phone: "0665454271",
        role: "beneficiary-representative",
        email: "beneficiary@representative.fr",
      })
      .build();

    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    (uow.agencyRepository as InMemoryAgencyRepository).setAgencies([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalConventionValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(conventionWithBeneficiaryRepresentative);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        conventionWithBeneficiaryRepresentative.signatories.beneficiary.email,
        conventionWithBeneficiaryRepresentative.signatories
          .establishmentRepresentative.email,
        conventionWithBeneficiaryRepresentative.signatories
          .beneficiaryRepresentative!.email,
        counsellorEmail,
      ],
      sentEmails[0],
      agency,
      conventionWithBeneficiaryRepresentative,
    );
  });
  it("With PeConnect Federated identity: beneficiary, establishment tutor, agency counsellor, and dedicated advisor", async () => {
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
      uow.conventionPoleEmploiAdvisorRepository as InMemoryConventionPoleEmploiAdvisorRepository
    ).setConventionPoleEmploiUsersAdvisor(userConventionAdvisor);

    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepository = new InMemoryAgencyRepository([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalConventionValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        validConvention.signatories.beneficiary.email,
        validConvention.signatories.establishmentRepresentative.email,
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

  it("simple convention", () => {
    const convention = new ConventionDtoBuilder()
      .withImmersionAddress("immersionAddress")
      .withSanitaryPrevention(true)
      .withSanitaryPreventionDescription("sanitaryPreventionDescription")
      .withIndividualProtection(true)
      .withSchedule(reasonableSchedule)
      .build();

    expectTypeToMatchAndEqual(
      getValidatedConventionFinalConfirmationParams(agency, convention),
      {
        totalHours: 70,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        emergencyContact: convention.signatories.beneficiary.emergencyContact,
        emergencyContactPhone:
          convention.signatories.beneficiary.emergencyContactPhone,
        dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        scheduleText: prettyPrintSchedule(convention.schedule).split("\n"),
        businessName: convention.businessName,
        immersionAddress: "immersionAddress",
        immersionAppellationLabel:
          convention.immersionAppellation.appellationLabel,
        immersionActivities: convention.immersionActivities,
        immersionSkills: convention.immersionSkills ?? "Non renseigné",
        establishmentRepresentativeName: `${convention.signatories.establishmentRepresentative.firstName} ${convention.signatories.establishmentRepresentative.lastName}`,
        sanitaryPrevention: "sanitaryPreventionDescription",
        individualProtection: "oui",
        questionnaireUrl: agency.questionnaireUrl,
        signature: agency.signature,
        workConditions: convention.workConditions,
        beneficiaryRepresentativeName: "",
      },
    );
  });

  it("prints correct sanitaryPreventionMessage when missing", () => {
    const convention = new ConventionDtoBuilder()
      .withSanitaryPrevention(false)
      .build();

    const actualParms = getValidatedConventionFinalConfirmationParams(
      agency,
      convention,
    );

    expect(actualParms.sanitaryPrevention).toBe("non");
  });

  it("prints correct individualProtection when missing", () => {
    const convention = new ConventionDtoBuilder()
      .withIndividualProtection(false)
      .build();

    const actualParms = getValidatedConventionFinalConfirmationParams(
      agency,
      convention,
    );

    expect(actualParms.individualProtection).toBe("non");
  });

  it("with beneficiary representative", () => {
    const convention = new ConventionDtoBuilder()
      .withImmersionAddress("immersionAddress")
      .withSanitaryPrevention(true)
      .withSanitaryPreventionDescription("sanitaryPreventionDescription")
      .withIndividualProtection(true)
      .withSchedule(reasonableSchedule)
      .withBeneficiaryRepresentative({
        role: "beneficiary-representative",
        firstName: "beneficiary",
        lastName: "representative",
        email: "rep@rep.com",
        phone: "0011223344",
      })
      .build();

    expectTypeToMatchAndEqual(
      getValidatedConventionFinalConfirmationParams(agency, convention),
      {
        totalHours: 70,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        emergencyContact: convention.signatories.beneficiary.emergencyContact,
        emergencyContactPhone:
          convention.signatories.beneficiary.emergencyContactPhone,
        dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        scheduleText: prettyPrintSchedule(convention.schedule).split("\n"),
        businessName: convention.businessName,
        immersionAddress: "immersionAddress",
        immersionAppellationLabel:
          convention.immersionAppellation.appellationLabel,
        immersionActivities: convention.immersionActivities,
        immersionSkills: convention.immersionSkills ?? "Non renseigné",
        establishmentRepresentativeName: `${convention.signatories.establishmentRepresentative.firstName} ${convention.signatories.establishmentRepresentative.lastName}`,
        sanitaryPrevention: "sanitaryPreventionDescription",
        individualProtection: "oui",
        questionnaireUrl: agency.questionnaireUrl,
        signature: agency.signature,
        workConditions: convention.workConditions,
        beneficiaryRepresentativeName: `${
          convention.signatories.beneficiaryRepresentative!.firstName
        } ${convention.signatories.beneficiaryRepresentative!.lastName}`,
      },
    );
  });
});
