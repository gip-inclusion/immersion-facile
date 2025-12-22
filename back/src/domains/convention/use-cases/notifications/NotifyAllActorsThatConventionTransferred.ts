import { uniq, uniqBy } from "ramda";
import {
  type AgencyDto,
  type ConventionDto,
  type ConventionRole,
  type Email,
  errors,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  makeUrlWithQueryParams,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import type { TransferConventionToAgencyPayload } from "../../../core/events/eventPayload.dto";
import { transferConventionToAgencyPayloadSchema } from "../../../core/events/eventPayload.schema";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
export type NotifyAllActorsThatConventionTransferred = ReturnType<
  typeof makeNotifyAllActorsThatConventionTransferred
>;

export const makeNotifyAllActorsThatConventionTransferred = useCaseBuilder(
  "NotifyAllActorsThatConventionTransferred",
)
  .withInput<TransferConventionToAgencyPayload>(
    transferConventionToAgencyPayloadSchema,
  )
  .withOutput<void>()
  .withCurrentUser<void>()
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    timeGateway: TimeGateway;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    config: AppConfig;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const { agencyId, conventionId, justification, previousAgencyId } =
      inputParams;

    const previousAgency = await uow.agencyRepository.getById(previousAgencyId);
    if (!previousAgency) {
      throw errors.agency.notFound({ agencyId: previousAgencyId });
    }

    const agencyWithRights = await uow.agencyRepository.getById(agencyId);
    if (!agencyWithRights) {
      throw errors.agency.notFound({ agencyId });
    }

    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

    const convention = await uow.conventionRepository.getById(conventionId);
    if (!convention) {
      throw errors.convention.notFound({ conventionId });
    }

    const signatoriesRecipientsRoleAndEmail: {
      role: ConventionRole;
      email: Email;
    }[] = uniqBy(
      (recipient) => recipient.email,
      [
        ...Object.values(convention.signatories).map((signatory) => ({
          role: signatory.role,
          email: signatory.email,
        })),
        ...(convention.signatories.establishmentRepresentative.email !==
        convention.establishmentTutor.email
          ? [
              {
                role: convention.establishmentTutor.role,
                email: convention.establishmentTutor.email,
              },
            ]
          : []),
      ],
    );

    const agencyRecipientsEmails: Email[] = uniq([
      ...agency.counsellorEmails,
      ...agency.validatorEmails,
    ]);

    await Promise.all([
      ...sendAgencyEmails(
        agencyRecipientsEmails,
        convention,
        uow,
        justification,
        previousAgency.name,
        {
          config: deps.config,
          timeGateway: deps.timeGateway,
          generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
          saveNotificationAndRelatedEvent: deps.saveNotificationAndRelatedEvent,
        },
      ),
      ...sendSignatoriesEmail(
        signatoriesRecipientsRoleAndEmail,
        convention,
        uow,
        justification,
        agency,
        previousAgency.name,
        {
          config: deps.config,
          timeGateway: deps.timeGateway,
          generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
          saveNotificationAndRelatedEvent: deps.saveNotificationAndRelatedEvent,
        },
      ),
    ]);
  });

const sendAgencyEmails = (
  agencyRecipientsEmails: Email[],
  convention: ConventionDto,
  uow: UnitOfWork,
  justification: string,
  previousAgencyName: string,
  deps: {
    config: AppConfig;
    timeGateway: TimeGateway;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  },
) => {
  return agencyRecipientsEmails.map(async (email) => {
    return deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION",
        recipients: [email],
        params: {
          internshipKind: convention.internshipKind,
          beneficiaryEmail: convention.signatories.beneficiary.email,
          beneficiaryFirstName: getFormattedFirstnameAndLastname({
            firstname: convention.signatories.beneficiary.firstName,
          }),
          beneficiaryLastName: getFormattedFirstnameAndLastname({
            lastname: convention.signatories.beneficiary.lastName,
          }),
          beneficiaryPhone: convention.signatories.beneficiary.phone,
          previousAgencyName,
          justification,
          manageConventionLink: `${deps.config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
            `/${frontRoutes.manageConventionUserConnected}`,
            {
              conventionId: convention.id,
            },
          )}`,
          conventionId: convention.id,
        },
      },
      followedIds: {
        conventionId: convention.id,
        agencyId: convention.agencyId,
        establishmentSiret: convention.siret,
      },
    });
  });
};

const sendSignatoriesEmail = (
  signatoriesRecipientsRoleAndEmail: { role: ConventionRole; email: Email }[],
  convention: ConventionDto,
  uow: UnitOfWork,
  justification: string,
  agency: AgencyDto,
  previousAgencyName: string,
  deps: {
    config: AppConfig;
    timeGateway: TimeGateway;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  },
) => {
  return signatoriesRecipientsRoleAndEmail.map(async (emailAndRole) => {
    const { role, email } = emailAndRole;
    const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
      config: deps.config,
      conventionMagicLinkPayload: {
        id: convention.id,
        role,
        email,
        now: deps.timeGateway.now(),
      },
      generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
      uow,
    });

    const shortLink = await makeShortMagicLink({
      targetRoute: frontRoutes.manageConvention,
      lifetime: "short",
    });

    return deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "CONVENTION_TRANSFERRED_SIGNATORY_NOTIFICATION",
        recipients: [email],
        params: {
          internshipKind: convention.internshipKind,
          immersionProfession: convention.immersionAppellation.appellationLabel,
          newAgencyName: agency.name,
          agencyAddress: `${agency.address.streetNumberAndAddress} ${agency.address.postcode} ${agency.address.city}`,
          businessName: convention.businessName,
          justification,
          magicLink: shortLink,
          conventionId: convention.id,
          previousAgencyName,
        },
      },
      followedIds: {
        conventionId: convention.id,
        agencyId: convention.agencyId,
        establishmentSiret: convention.siret,
      },
    });
  });
};
