import { parseISO } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  displayEmergencyContactInfos,
  expectTypeToMatchAndEqual,
  PeConnectIdentity,
  prettyPrintSchedule,
  reasonableSchedule,
} from "shared";
import { expectEmailFinalValidationConfirmationMatchingConvention } from "../../../../_testBuilders/emailAssertions";

import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";
import {
  getValidatedConventionFinalConfirmationParams,
  NotifyAllActorsOfFinalConventionValidation,
} from "./NotifyAllActorsOfFinalConventionValidation";

const establishmentTutorEmail = "boss@mail.com";
const validConvention: ConventionDto = new ConventionDtoBuilder()
  .withEstablishmentTutorEmail(establishmentTutorEmail)
  .withEstablishmentRepresentativeEmail(establishmentTutorEmail)
  .build();

const counsellorEmail = "counsellor@email.fr";
const validatorEmail = "myValidator@mail.com";
const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId)
  .withValidatorEmails([validatorEmail])
  .build();

describe("NotifyAllActorsOfFinalApplicationValidation sends confirmation email to all actors", () => {
  let uow: InMemoryUnitOfWork;
  let emailGw: InMemoryEmailGateway;
  let notifyAllActorsOfFinalConventionValidation: NotifyAllActorsOfFinalConventionValidation;

  beforeEach(() => {
    uow = createInMemoryUow();
    emailGw = new InMemoryEmailGateway();
    notifyAllActorsOfFinalConventionValidation =
      new NotifyAllActorsOfFinalConventionValidation(
        new InMemoryUowPerformer(uow),
        emailGw,
      );
  });

  it("Default actors: beneficiary, establishement tutor, agency counsellor", async () => {
    const agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepository.setAgencies([agency]);

    await notifyAllActorsOfFinalConventionValidation.execute(validConvention);

    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        validConvention.signatories.beneficiary.email,
        validConvention.signatories.establishmentRepresentative.email,
        counsellorEmail,
        validatorEmail,
      ],
      emailGw.getSentEmails(),
      agency,
      validConvention,
    );
  });

  it("With beneficiary current employer", async () => {
    const agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepository.setAgencies([agency]);

    const conventionWithBeneficiaryCurrentEmployer = new ConventionDtoBuilder(
      validConvention,
    )
      .withBeneficiaryCurentEmployer({
        businessName: "boss",
        role: "beneficiary-current-employer",
        email: "current@employer.com",
        phone: "001223344",
        firstName: "Harry",
        lastName: "Potter",
        job: "Magician",
        businessSiret: "01234567891234",
      })
      .build();

    await notifyAllActorsOfFinalConventionValidation.execute(
      conventionWithBeneficiaryCurrentEmployer,
    );

    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        conventionWithBeneficiaryCurrentEmployer.signatories.beneficiary.email,
        conventionWithBeneficiaryCurrentEmployer.signatories
          .establishmentRepresentative.email,
        conventionWithBeneficiaryCurrentEmployer.signatories
          .beneficiaryCurrentEmployer!.email,
        counsellorEmail,
        validatorEmail,
      ],
      emailGw.getSentEmails(),
      agency,
      conventionWithBeneficiaryCurrentEmployer,
    );
  });

  it("With different establishment tutor and establishment representative", async () => {
    const agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepository.setAgencies([agency]);

    const conventionWithSpecificEstablishementEmail = new ConventionDtoBuilder()
      .withEstablishmentTutorEmail(establishmentTutorEmail)
      .build();

    await notifyAllActorsOfFinalConventionValidation.execute(
      conventionWithSpecificEstablishementEmail,
    );

    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        conventionWithSpecificEstablishementEmail.signatories.beneficiary.email,
        conventionWithSpecificEstablishementEmail.signatories
          .establishmentRepresentative.email,
        counsellorEmail,
        validatorEmail,
        conventionWithSpecificEstablishementEmail.establishmentTutor.email,
      ],
      emailGw.getSentEmails(),
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

    const agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepository.setAgencies([agency]);

    await notifyAllActorsOfFinalConventionValidation.execute(
      conventionWithBeneficiaryRepresentative,
    );

    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        conventionWithBeneficiaryRepresentative.signatories.beneficiary.email,
        conventionWithBeneficiaryRepresentative.signatories
          .establishmentRepresentative.email,
        conventionWithBeneficiaryRepresentative.signatories
          .beneficiaryRepresentative!.email,
        counsellorEmail,
        validatorEmail,
      ],
      emailGw.getSentEmails(),
      agency,
      conventionWithBeneficiaryRepresentative,
    );
  });
  it("With PeConnect Federated identity: beneficiary, establishment tutor, agency counsellor & validator, and dedicated advisor", async () => {
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

    uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      userConventionAdvisor,
    );

    const agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepository.setAgencies([agency]);

    await notifyAllActorsOfFinalConventionValidation.execute(validConvention);

    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        validConvention.signatories.beneficiary.email,
        validConvention.signatories.establishmentRepresentative.email,
        counsellorEmail,
        validatorEmail,
        userConventionAdvisor.email,
      ],
      emailGw.getSentEmails(),
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
        beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,
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
        agencyName: agency.name,
        emergencyContactInfos: displayEmergencyContactInfos({
          ...convention.signatories,
        }),
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
        beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,
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
        agencyName: agency.name,
        emergencyContactInfos: displayEmergencyContactInfos({
          ...convention.signatories,
        }),
      },
    );
  });
});
