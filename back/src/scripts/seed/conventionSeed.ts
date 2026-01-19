import {
  type AgencyId,
  type AgencyKind,
  ConventionDtoBuilder,
  conventionSchema,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  reasonableSchedule,
} from "shared";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeGenerateConventionMagicLinkUrl } from "../../config/bootstrap/magicLinkUrl";
import { makeGenerateJwtES256 } from "../../domains/core/jwt";
import type { UnitOfWork } from "../../domains/core/unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { franceMerguez } from "./establishmentSeed";
import { getRandomAgencyId } from "./seed.helpers";

export const conventionSeed = async (
  uow: UnitOfWork,
  agencyIds: Record<AgencyKind, AgencyId[]>,
) => {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log("conventionSeed start...");

  const uuidGenerator = new UuidV4Generator();
  const peConvention = new ConventionDtoBuilder()
    .withId(uuidGenerator.new())
    .withSiret(franceMerguez.establishment.siret)
    .withBusinessName(franceMerguez.establishment.name)
    .withInternshipKind("immersion")
    .withDateStart(new Date("2023-03-27").toISOString())
    .withDateEnd(new Date("2023-03-28").toISOString())
    .withStatus("READY_TO_SIGN")
    .withAgencyId(getRandomAgencyId({ kind: "pole-emploi", agencyIds }))
    .withSchedule(reasonableSchedule)
    .build();

  const cciConvention = new ConventionDtoBuilder()
    .withId(uuidGenerator.new())
    .withSiret(franceMerguez.establishment.siret)
    .withBusinessName(franceMerguez.establishment.name)
    .withInternshipKind("mini-stage-cci")
    .withDateStart(new Date("2023-05-01").toISOString())
    .withDateEnd(new Date("2023-05-03").toISOString())
    .withStatus("READY_TO_SIGN")
    .withAgencyId(getRandomAgencyId({ kind: "cci", agencyIds }))
    .withSchedule(reasonableSchedule)
    .build();

  const conventionWithAssessmentReadyToFill = new ConventionDtoBuilder()
    .withId(uuidGenerator.new())
    .withSiret(franceMerguez.establishment.siret)
    .withBusinessName(franceMerguez.establishment.name)
    .withInternshipKind("immersion")
    .withDateStart(new Date("2025-01-01").toISOString())
    .withDateEnd(new Date("2025-01-05").toISOString())
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(getRandomAgencyId({ kind: "pole-emploi", agencyIds }))
    .withSchedule(reasonableSchedule)
    .build();

  const config = AppConfig.createFromEnv();
  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    3600 * 24 * 30,
  );

  conventionSchema.parse(peConvention);

  conventionSchema.parse(cciConvention);

  conventionSchema.parse(conventionWithAssessmentReadyToFill);

  const peConventionBeneficiaryPhoneNumber = "+33500000000";
  const peConventionEstablishmentTutorPhoneNumber = "+33500000001";
  const peConventionEstablishmentRepresentativePhoneNumber = "+33500000002";
  const peConventionBeneficiaryRepresentativePhoneNumber = "+33500000003";
  const peConventionBeneficiaryCurrentEmployerPhoneNumber = "+33500000004";

  const cciConventionBeneficiaryPhoneNumber = "+33500000010";
  const cciConventionEstablishmentTutorPhoneNumber = "+33500000011";
  const cciConventionEstablishmentRepresentativePhoneNumber = "+33500000012";
  const cciConventionBeneficiaryRepresentativePhoneNumber = "+33500000013";
  const cciConventionBeneficiaryCurrentEmployerPhoneNumber = "+33500000014";

  const conventionWithAssessmentReadyToFillBeneficiaryPhoneNumber =
    "+33500000020";
  const conventionWithAssessmentReadyToFillEstablishmentTutorPhoneNumber =
    "+33500000021";
  const conventionWithAssessmentReadyToFillEstablishmentRepresentativePhoneNumber =
    "+33500000022";
  const conventionWithAssessmentReadyToFillBeneficiaryRepresentativePhoneNumber =
    "+33500000023";
  const conventionWithAssessmentReadyToFillBeneficiaryCurrentEmployerPhoneNumber =
    "+33500000024";

  const peConventionPhoneNumberIds = await Promise.all([
    uow.phoneNumberRepository.getIdByPhoneNumber(
      peConventionBeneficiaryPhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      peConventionEstablishmentTutorPhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      peConventionEstablishmentRepresentativePhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      peConventionBeneficiaryRepresentativePhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      peConventionBeneficiaryCurrentEmployerPhoneNumber,
      new Date(),
    ),
  ]);

  const cciConventionPhoneNumberIds = await Promise.all([
    uow.phoneNumberRepository.getIdByPhoneNumber(
      cciConventionBeneficiaryPhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      cciConventionEstablishmentTutorPhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      cciConventionEstablishmentRepresentativePhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      cciConventionBeneficiaryRepresentativePhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      cciConventionBeneficiaryCurrentEmployerPhoneNumber,
      new Date(),
    ),
  ]);

  const conventionWithAssessmentReadyToFillPhoneNumberIds = await Promise.all([
    uow.phoneNumberRepository.getIdByPhoneNumber(
      conventionWithAssessmentReadyToFillBeneficiaryPhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      conventionWithAssessmentReadyToFillEstablishmentTutorPhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      conventionWithAssessmentReadyToFillEstablishmentRepresentativePhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      conventionWithAssessmentReadyToFillBeneficiaryRepresentativePhoneNumber,
      new Date(),
    ),
    uow.phoneNumberRepository.getIdByPhoneNumber(
      conventionWithAssessmentReadyToFillBeneficiaryCurrentEmployerPhoneNumber,
      new Date(),
    ),
  ]);

  await Promise.all([
    uow.conventionRepository.save({
      conventionDto: peConvention,
      phoneIds: {
        beneficiary: peConventionPhoneNumberIds[0],
        establishmentTutor: peConventionPhoneNumberIds[1],
        establishmentRepresentative: peConventionPhoneNumberIds[2],
        beneficiaryRepresentative: peConventionPhoneNumberIds[3],
        beneficiaryCurrentEmployer: peConventionPhoneNumberIds[4],
      },
    }),
    uow.conventionRepository.save({
      conventionDto: cciConvention,
      phoneIds: {
        beneficiary: cciConventionPhoneNumberIds[0],
        establishmentTutor: cciConventionPhoneNumberIds[1],
        establishmentRepresentative: cciConventionPhoneNumberIds[2],
        beneficiaryRepresentative: cciConventionPhoneNumberIds[3],
        beneficiaryCurrentEmployer: cciConventionPhoneNumberIds[4],
      },
    }),
    uow.conventionRepository.save({
      conventionDto: conventionWithAssessmentReadyToFill,
      phoneIds: {
        beneficiary: conventionWithAssessmentReadyToFillPhoneNumberIds[0],
        establishmentTutor:
          conventionWithAssessmentReadyToFillPhoneNumberIds[1],
        establishmentRepresentative:
          conventionWithAssessmentReadyToFillPhoneNumberIds[2],
        beneficiaryRepresentative:
          conventionWithAssessmentReadyToFillPhoneNumberIds[3],
        beneficiaryCurrentEmployer:
          conventionWithAssessmentReadyToFillPhoneNumberIds[4],
      },
    }),
  ]);

  await uow.notificationRepository.save({
    id: uuidGenerator.new(),
    createdAt: new Date().toISOString(),
    kind: "email",
    templatedContent: {
      kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      recipients: [
        conventionWithAssessmentReadyToFill.establishmentTutor.email,
      ],
      sender: immersionFacileNoReplyEmailSender,
      params: {
        agencyLogoUrl: undefined,
        beneficiaryFirstName: getFormattedFirstnameAndLastname({
          firstname:
            conventionWithAssessmentReadyToFill.signatories.beneficiary
              .firstName,
        }),
        beneficiaryLastName: getFormattedFirstnameAndLastname({
          lastname:
            conventionWithAssessmentReadyToFill.signatories.beneficiary
              .lastName,
        }),
        conventionId: conventionWithAssessmentReadyToFill.id,
        establishmentTutorName: `${conventionWithAssessmentReadyToFill.establishmentTutor.firstName} ${conventionWithAssessmentReadyToFill.establishmentTutor.lastName}`,
        assessmentCreationLink: makeGenerateConventionMagicLinkUrl(
          config,
          generateConventionJwt,
        )({
          email: conventionWithAssessmentReadyToFill.establishmentTutor.email,
          id: conventionWithAssessmentReadyToFill.id,
          now: new Date(),
          role: "establishment-tutor",
          targetRoute: frontRoutes.assessment,
        }),
        internshipKind: conventionWithAssessmentReadyToFill.internshipKind,
      },
    },
    followedIds: {
      conventionId: conventionWithAssessmentReadyToFill.id,
      agencyId: conventionWithAssessmentReadyToFill.agencyId,
      establishmentSiret: conventionWithAssessmentReadyToFill.siret,
    },
  });
  await uow.outboxRepository.save({
    id: uuidGenerator.new(),
    occurredAt: new Date().toISOString(),
    status: "published",
    publications: [],
    wasQuarantined: false,
    topic: "EmailWithLinkToCreateAssessmentSent",
    payload: {
      id: conventionWithAssessmentReadyToFill.id,
    },
  });

  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log("conventionSeed done");
};
