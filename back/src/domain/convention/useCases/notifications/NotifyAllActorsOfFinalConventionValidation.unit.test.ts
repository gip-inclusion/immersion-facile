import { parseISO } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  CreateConventionMagicLinkPayloadProperties,
  displayEmergencyContactInfos,
  expectTypeToMatchAndEqual,
  frontRoutes,
  reasonableSchedule,
} from "shared";
import {
  expectEmailFinalValidationConfirmationMatchingConvention,
  getValidatedConventionFinalConfirmationParams,
} from "../../../../_testBuilders/emailAssertions";

import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";
import { NotifyAllActorsOfFinalConventionValidation } from "./NotifyAllActorsOfFinalConventionValidation";
import { RealTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/RealTimeGateway";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";

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
  let timeGw: CustomTimeGateway;
  let notifyAllActorsOfFinalConventionValidation: NotifyAllActorsOfFinalConventionValidation;

  beforeEach(() => {
    uow = createInMemoryUow();
    emailGw = new InMemoryEmailGateway();
    timeGw = new CustomTimeGateway();
    notifyAllActorsOfFinalConventionValidation =
      new NotifyAllActorsOfFinalConventionValidation(
        new InMemoryUowPerformer(uow),
        emailGw,
        fakeGenerateMagicLinkUrlFn,
        timeGw,
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
      fakeGenerateMagicLinkUrlFn,
      timeGw,
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
      .withBeneficiaryCurrentEmployer({
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
      fakeGenerateMagicLinkUrlFn,
      timeGw,
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
      fakeGenerateMagicLinkUrlFn,
      timeGw,
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
      fakeGenerateMagicLinkUrlFn,
      timeGw,
    );
  });
  it("With PeConnect Federated identity: beneficiary, establishment tutor, agency counsellor & validator, and dedicated advisor", async () => {
    const userPeExternalId = "i-am-an-external-id";
    const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
      _entityName: "ConventionPoleEmploiAdvisor",
      advisor: {
        email: "elsa.oldenburg@pole-emploi.net",
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
        userConventionAdvisor.advisor!.email,
      ],
      emailGw.getSentEmails(),
      agency,
      validConvention,
      fakeGenerateMagicLinkUrlFn,
      timeGw,
    );
  });
  it("With PeConnect Federated identity: beneficiary, establishment tutor, agency counsellor & validator, and no advisor", async () => {
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
      fakeGenerateMagicLinkUrlFn,
      timeGw,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
  const timeGw = new RealTimeGateway();
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
    const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties = {
      id: convention.id,
      role: convention.signatories.beneficiary.role,
      email: convention.signatories.beneficiary.email,
      now: timeGw.now(),
    };
    expectTypeToMatchAndEqual(
      getValidatedConventionFinalConfirmationParams(
        agency,
        convention,
        fakeGenerateMagicLinkUrlFn,
        timeGw,
      ),
      {
        internshipKind: convention.internshipKind,

        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,

        beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,

        dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,

        businessName: convention.businessName,

        immersionAppellationLabel:
          convention.immersionAppellation.appellationLabel,

        emergencyContactInfos: displayEmergencyContactInfos({
          ...convention.signatories,
        }),
        agencyLogoUrl: agency.logoUrl,
        magicLink: fakeGenerateMagicLinkUrlFn({
          ...magicLinkCommonFields,
          targetRoute: frontRoutes.conventionDocument,
        }),
      },
    );
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

    const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties = {
      id: convention.id,
      role: convention.signatories.beneficiary.role,
      email: convention.signatories.beneficiary.email,
      now: timeGw.now(),
    };

    expectTypeToMatchAndEqual(
      getValidatedConventionFinalConfirmationParams(
        agency,
        convention,
        fakeGenerateMagicLinkUrlFn,
        timeGw,
      ),
      {
        internshipKind: convention.internshipKind,

        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,

        dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,

        businessName: convention.businessName,

        immersionAppellationLabel:
          convention.immersionAppellation.appellationLabel,

        emergencyContactInfos: displayEmergencyContactInfos({
          ...convention.signatories,
        }),
        agencyLogoUrl: agency.logoUrl,
        magicLink: fakeGenerateMagicLinkUrlFn({
          ...magicLinkCommonFields,
          targetRoute: frontRoutes.conventionDocument,
        }),
      },
    );
  });
});
