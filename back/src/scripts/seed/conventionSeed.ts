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

  await Promise.all([
    uow.conventionRepository.save(peConvention),
    uow.conventionRepository.save(cciConvention),
    uow.conventionRepository.save(conventionWithAssessmentReadyToFill),
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
