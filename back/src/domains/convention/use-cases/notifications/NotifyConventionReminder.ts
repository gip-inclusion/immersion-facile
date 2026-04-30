import { format } from "date-fns";
import { uniq } from "ramda";
import {
  type AgencyDto,
  allDefaultPhoneNumbers,
  type Beneficiary,
  type BeneficiaryCurrentEmployer,
  type BeneficiaryRepresentative,
  type ConventionActorRole,
  type ConventionDto,
  type ConventionReadDto,
  type Email,
  type EstablishmentRepresentative,
  type ExtractFromExisting,
  errors,
  filterNotFalsy,
  frontRoutes,
  type GenericActor,
  getFormattedFirstnameAndLastname,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isSignatoryRole,
  makeUrlWithQueryParams,
  type ReminderKind,
  smsRecipientPhoneSchema,
  type TemplatedEmail,
  type TemplatedSms,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { conventionReminderPayloadSchema } from "../../../core/events/eventPayload.schema";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

type SignatoriesReminderKind = ExtractFromExisting<
  ReminderKind,
  "ReminderForSignatories"
>;

type AgenciesReminderKind = ExtractFromExisting<
  ReminderKind,
  "FirstReminderForAgency" | "LastReminderForAgency"
>;

export type NotifyConventionReminder = ReturnType<
  typeof makeNotifyConventionReminder
>;

type Deps = {
  timeGateway: TimeGateway;
  saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
};

export const makeNotifyConventionReminder = useCaseBuilder(
  "NotifyConventionReminder",
)
  .withInput(conventionReminderPayloadSchema)
  .withDeps<Deps>()
  .build(async ({ inputParams: { conventionId, reminderKind }, uow, deps }) => {
    const conventionRead =
      await uow.conventionQueries.getConventionById(conventionId);
    if (!conventionRead) throw errors.convention.notFound({ conventionId });

    return reminderKind === "ReminderForSignatories"
      ? onSignatoriesReminder({
          reminderKind,
          conventionRead,
          uow,
          deps,
        })
      : onAgencyReminder({
          reminderKind,
          conventionRead,
          uow,
          deps,
        });
  });

const onAgencyReminder = async ({
  reminderKind,
  conventionRead,
  uow,
  deps,
}: {
  reminderKind: AgenciesReminderKind;
  conventionRead: ConventionReadDto;
  uow: UnitOfWork;
  deps: Deps;
}): Promise<void> => {
  const agencyWithRights = await uow.agencyRepository.getById(
    conventionRead.agencyId,
  );
  if (!agencyWithRights)
    throw errors.agency.notFound({
      agencyId: conventionRead.agencyId,
    });

  const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);
  if (conventionRead.status !== "IN_REVIEW")
    throw errors.convention.forbiddenReminder({
      convention: conventionRead,
      kind: reminderKind,
    });

  const counsellorsAndValidatorsEmails = uniq([
    ...agency.validatorEmails,
    ...agency.counsellorEmails,
  ]);

  await deps.saveNotificationsBatchAndRelatedEvent(
    uow,
    await Promise.all(
      counsellorsAndValidatorsEmails.map((counsellorOrValidatorEmail) =>
        createAgencyReminderEmail({
          counsellorOrValidatorEmail,
          conventionRead,
          agency,
          reminderKind,
          config: deps.config,
        }),
      ),
    ),
  );
};

const onSignatoriesReminder = async ({
  reminderKind,
  conventionRead,
  uow,
  deps,
}: {
  reminderKind: SignatoriesReminderKind;
  conventionRead: ConventionReadDto;
  uow: UnitOfWork;
  deps: Deps;
}): Promise<void> => {
  if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(conventionRead.status))
    throw errors.convention.forbiddenReminder({
      convention: conventionRead,
      kind: reminderKind,
    });

  const signatories = Object.values(conventionRead.signatories);

  const smsSignatories = signatories.filter(
    (signatory) =>
      !signatory.signedAt &&
      smsRecipientPhoneSchema.safeParse(signatory.phone).success &&
      !allDefaultPhoneNumbers.includes(signatory.phone),
  );

  const emailActors = [
    ...signatories,
    ...(isEstablishmentTutorIsEstablishmentRepresentative(conventionRead)
      ? []
      : [conventionRead.establishmentTutor]),
  ];

  const templatedEmails: TemplatedEmail[] = await Promise.all(
    emailActors.map((actor) =>
      makeSignatoryReminderEmail({
        actor,
        conventionRead: conventionRead,
        uow,
        deps,
      }),
    ),
  );

  const templatedSms = await Promise.all(
    smsSignatories.map((signatory) =>
      prepareSmsReminderParams({
        actor: signatory,
        conventionRead,
        uow,
        reminderKind,
        deps,
      }),
    ),
  );

  const followedIds = {
    conventionId: conventionRead.id,
    agencyId: conventionRead.agencyId,
    establishmentSiret: conventionRead.siret,
  };

  await deps.saveNotificationsBatchAndRelatedEvent(uow, [
    ...templatedEmails.map(
      (email): NotificationContentAndFollowedIds => ({
        kind: "email",
        followedIds,
        templatedContent: email,
      }),
    ),
    ...templatedSms.map(
      (sms): NotificationContentAndFollowedIds => ({
        kind: "sms",
        followedIds,
        templatedContent: sms,
      }),
    ),
  ]);
};

const makeSignatoryReminderEmail = async ({
  actor: { email, role, firstName, lastName },
  conventionRead,
  uow,
  deps,
}: {
  actor: GenericActor<ConventionActorRole>;
  conventionRead: ConventionDto;
  uow: UnitOfWork;
  deps: Deps;
}): Promise<TemplatedEmail> => ({
  kind: "SIGNATORY_REMINDER",
  recipients: [email],
  params: {
    actorFirstName: getFormattedFirstnameAndLastname({
      firstname: firstName,
    }),
    actorLastName: getFormattedFirstnameAndLastname({ lastname: lastName }),
    beneficiaryFirstName: getFormattedFirstnameAndLastname({
      firstname: conventionRead.signatories.beneficiary.firstName,
    }),
    beneficiaryLastName: getFormattedFirstnameAndLastname({
      lastname: conventionRead.signatories.beneficiary.lastName,
    }),
    businessName: conventionRead.businessName,
    conventionId: conventionRead.id,
    signatoriesSummary: toSignatoriesSummary(conventionRead).join("\n"),
    magicLinkUrl: isSignatoryRole(role)
      ? await prepareConventionMagicShortLinkMaker({
          config: deps.config,
          conventionMagicLinkPayload: {
            id: conventionRead.id,
            role,
            email,
            now: deps.timeGateway.now(),
          },
          generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
          uow,
        })({
          targetRoute: frontRoutes.conventionToSign,
          lifetime: "1Month",
        })
      : undefined,
  },
});

const prepareSmsReminderParams = async ({
  actor: { role, email, phone },
  conventionRead,
  uow,
  reminderKind,
  deps,
}: {
  actor: GenericActor<ConventionActorRole>;
  conventionRead: ConventionReadDto;
  uow: UnitOfWork;
  reminderKind: SignatoriesReminderKind;
  deps: Deps;
}): Promise<TemplatedSms> => {
  const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
    config: deps.config,
    conventionMagicLinkPayload: {
      id: conventionRead.id,
      role,
      email,
      now: deps.timeGateway.now(),
    },
    generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
    uow,
  });

  const shortLink = await makeShortMagicLink({
    targetRoute: frontRoutes.conventionToSign,
    lifetime: "1Month",
  });

  return {
    kind: reminderKind,
    recipientPhone: phone,
    params: { shortLink },
  };
};

const createAgencyReminderEmail = async ({
  counsellorOrValidatorEmail,
  conventionRead,
  agency,
  reminderKind,
  config,
}: {
  counsellorOrValidatorEmail: Email;
  conventionRead: ConventionDto;
  agency: AgencyDto;
  reminderKind: AgenciesReminderKind;
  config: AppConfig;
}): Promise<NotificationContentAndFollowedIds> => {
  const templatedEmail: TemplatedEmail =
    reminderKind === "FirstReminderForAgency"
      ? {
          kind: "AGENCY_FIRST_REMINDER",
          recipients: [counsellorOrValidatorEmail],
          params: {
            conventionId: conventionRead.id,
            agencyName: agency.name,
            agencyReferentName: getFormattedFirstnameAndLastname(
              conventionRead.agencyReferent ?? {},
            ),
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: conventionRead.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: conventionRead.signatories.beneficiary.lastName,
            }),
            businessName: conventionRead.businessName,
            dateStart: conventionRead.dateStart,
            dateEnd: conventionRead.dateEnd,
            manageConventionLink: `${config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
              `/${frontRoutes.manageConventionUserConnected}`,
              {
                conventionId: conventionRead.id,
              },
            )}`,
          },
        }
      : {
          kind: "AGENCY_LAST_REMINDER",
          recipients: [counsellorOrValidatorEmail],
          params: {
            conventionId: conventionRead.id,
            agencyReferentName: getFormattedFirstnameAndLastname(
              conventionRead.agencyReferent ?? {},
            ),
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: conventionRead.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: conventionRead.signatories.beneficiary.lastName,
            }),
            businessName: conventionRead.businessName,
            manageConventionLink: `${config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
              `/${frontRoutes.manageConventionUserConnected}`,
              {
                conventionId: conventionRead.id,
              },
            )}`,
          },
        };

  return {
    kind: "email",
    followedIds: {
      conventionId: conventionRead.id,
      agencyId: agency.id,
      establishmentSiret: conventionRead.siret,
    },
    templatedContent: templatedEmail,
  };
};

export const toSignatoriesSummary = ({
  signatories,
  businessName,
}: ConventionDto): string[] =>
  [
    beneficiarySummary(signatories.beneficiary),
    beneficiaryRepresentativeSummary(signatories.beneficiaryRepresentative),
    beneficiaryCurrentEmployer(signatories.beneficiaryCurrentEmployer),
    establishmentSummary(signatories.establishmentRepresentative, businessName),
  ].filter(filterNotFalsy);

const beneficiarySummary = (
  beneficiary: Beneficiary<"immersion" | "mini-stage-cci">,
): string =>
  `- ${signStatus(beneficiary.signedAt)} - ${beneficiary.firstName} ${
    beneficiary.lastName
  }, bénéficiaire`;

const beneficiaryRepresentativeSummary = (
  beneficiaryRepresentative: BeneficiaryRepresentative | undefined,
): string | undefined =>
  beneficiaryRepresentative &&
  `- ${signStatus(beneficiaryRepresentative.signedAt)} - ${
    beneficiaryRepresentative.firstName
  } ${beneficiaryRepresentative.lastName}, représentant légal du bénéficiaire`;

const beneficiaryCurrentEmployer = (
  beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer | undefined,
): string | undefined =>
  beneficiaryCurrentEmployer &&
  `- ${signStatus(beneficiaryCurrentEmployer.signedAt)} - ${
    beneficiaryCurrentEmployer.firstName
  } ${beneficiaryCurrentEmployer.lastName}, employeur actuel du bénéficiaire`;

const establishmentSummary = (
  establishmentRepresentative: EstablishmentRepresentative,
  businessName: string,
): string =>
  `- ${signStatus(establishmentRepresentative.signedAt)} - ${
    establishmentRepresentative.firstName
  } ${
    establishmentRepresentative.lastName
  }, représentant l'entreprise ${businessName}`;

const signStatus = (signAt: string | undefined): string =>
  signAt
    ? `√  - A signé le ${format(new Date(signAt), "dd/MM/yyyy")}`
    : `❌ - N'a pas signé`;
