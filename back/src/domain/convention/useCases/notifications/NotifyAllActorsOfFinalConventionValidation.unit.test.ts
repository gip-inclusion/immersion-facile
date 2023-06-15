import { parseISO } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  displayEmergencyContactInfos,
  expectToEqual,
  frontRoutes,
  reasonableSchedule,
} from "shared";
import { EmailNotification } from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  expectEmailFinalValidationConfirmationMatchingConvention,
  getValidatedConventionFinalConfirmationParams,
} from "../../../../_testBuilders/emailAssertions";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { DeterministShortLinkIdGeneratorGateway } from "../../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { makeShortLinkUrl } from "../../../core/ShortLink";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";
import { NotifyAllActorsOfFinalConventionValidation } from "./NotifyAllActorsOfFinalConventionValidation";

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
const shortLinkId = "shortLink1";

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let notifyAllActorsOfFinalConventionValidation: NotifyAllActorsOfFinalConventionValidation;
  let config: AppConfig;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    const shortLinkIdGeneratorGateway =
      new DeterministShortLinkIdGeneratorGateway();
    shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

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
        shortLinkIdGeneratorGateway,
        config,
      );
  });

  describe("NotifyAllActorsOfFinalApplicationValidation sends confirmation email to all actors", () => {
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
        getSavedEmailTemplates(),
        agency,
        validConvention,
        config,
        shortLinkId,
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
          businessAddress: "Rue des Bouchers 67065 Strasbourg",
        })
        .build();

      await notifyAllActorsOfFinalConventionValidation.execute(
        conventionWithBeneficiaryCurrentEmployer,
      );

      expectEmailFinalValidationConfirmationMatchingConvention(
        [
          conventionWithBeneficiaryCurrentEmployer.signatories.beneficiary
            .email,
          conventionWithBeneficiaryCurrentEmployer.signatories
            .establishmentRepresentative.email,
          conventionWithBeneficiaryCurrentEmployer.signatories
            .beneficiaryCurrentEmployer!.email,
          counsellorEmail,
          validatorEmail,
        ],
        getSavedEmailTemplates(),
        agency,
        conventionWithBeneficiaryCurrentEmployer,
        config,
        shortLinkId,
      );
    });

    it("With different establishment tutor and establishment representative", async () => {
      const agency = new AgencyDtoBuilder(defaultAgency)
        .withCounsellorEmails([counsellorEmail])
        .build();

      uow.agencyRepository.setAgencies([agency]);

      const conventionWithSpecificEstablishementEmail =
        new ConventionDtoBuilder()
          .withEstablishmentTutorEmail(establishmentTutorEmail)
          .build();

      await notifyAllActorsOfFinalConventionValidation.execute(
        conventionWithSpecificEstablishementEmail,
      );

      expectEmailFinalValidationConfirmationMatchingConvention(
        [
          conventionWithSpecificEstablishementEmail.signatories.beneficiary
            .email,
          conventionWithSpecificEstablishementEmail.signatories
            .establishmentRepresentative.email,
          counsellorEmail,
          validatorEmail,
          conventionWithSpecificEstablishementEmail.establishmentTutor.email,
        ],
        getSavedEmailTemplates(),
        agency,
        validConvention,
        config,
        shortLinkId,
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
        getSavedEmailTemplates(),
        agency,
        conventionWithBeneficiaryRepresentative,
        config,
        shortLinkId,
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

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinkId]: fakeGenerateMagicLinkUrlFn({
          id: validConvention.id,
          role: validConvention.signatories.beneficiary.role,
          email: validConvention.signatories.beneficiary.email,
          now: timeGateway.now(),
          exp: timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365, // 1 year
          targetRoute: frontRoutes.conventionDocument,
        }),
      });

      expectEmailFinalValidationConfirmationMatchingConvention(
        [
          validConvention.signatories.beneficiary.email,
          validConvention.signatories.establishmentRepresentative.email,
          counsellorEmail,
          validatorEmail,
          userConventionAdvisor.advisor!.email,
        ],
        getSavedEmailTemplates(),
        agency,
        validConvention,
        config,
        shortLinkId,
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
        getSavedEmailTemplates(),
        agency,
        validConvention,
        config,
        shortLinkId,
      );
    });
  });

  describe("getValidatedApplicationFinalConfirmationParams", () => {
    const timeGw = new CustomTimeGateway();
    const agency = new AgencyDtoBuilder(defaultAgency)
      .withQuestionnaireUrl("testQuestionnaireUrl")
      .withSignature("testSignature")
      .build();
    const config = new AppConfigBuilder({}).build();

    it("simple convention", () => {
      const convention = new ConventionDtoBuilder()
        .withImmersionAddress("immersionAddress")
        .withSanitaryPrevention(true)
        .withSanitaryPreventionDescription("sanitaryPreventionDescription")
        .withIndividualProtection(true)
        .withSchedule(reasonableSchedule)
        .build();

      const magicLinkNow = new Date("2023-04-12T10:00:00.000Z");
      timeGw.setNextDate(magicLinkNow);

      expectToEqual(
        getValidatedConventionFinalConfirmationParams(
          agency,
          convention,
          config,
          shortLinkId,
        ),
        {
          conventionId: convention.id,
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
          magicLink: makeShortLinkUrl(config, shortLinkId),
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

      expectToEqual(
        getValidatedConventionFinalConfirmationParams(
          agency,
          convention,
          config,
          shortLinkId,
        ),
        {
          conventionId: convention.id,
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
          magicLink: makeShortLinkUrl(config, shortLinkId),
        },
      );
    });
  });

  const getSavedEmailTemplates = () =>
    uow.notificationRepository.notifications
      .filter(
        (notification): notification is EmailNotification =>
          notification.kind === "email",
      )
      .map(({ templatedContent }) => templatedContent);
});
