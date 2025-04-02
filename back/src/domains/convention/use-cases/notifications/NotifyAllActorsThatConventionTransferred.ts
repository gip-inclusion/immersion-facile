import { uniq } from "ramda";
import {
  type AgencyDto,
  type ConventionDto,
  type Email,
  type Role,
  errors,
  frontRoutes,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { TransferConventionToAgencyPayload } from "../../../core/events/eventPayload.dto";
import { transferConventionToAgencyPayloadSchema } from "../../../core/events/eventPayload.schema";

import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { prepareMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
export type NotifyAllActorsThatConventionTransferred = ReturnType<
  typeof makeNotifyAllActorsThatConventionTransferred
>;

export const makeNotifyAllActorsThatConventionTransferred =
  createTransactionalUseCase<
    TransferConventionToAgencyPayload,
    void,
    void,
    {
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
      generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
      timeGateway: TimeGateway;
      shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
      config: AppConfig;
    }
  >(
    {
      name: "NotifyAllActorsThatConventionTransferred",
      inputSchema: transferConventionToAgencyPayloadSchema,
    },
    async ({ inputParams, uow, deps }) => {
      const { agencyId, convention, justification, previousAgencyId } =
        inputParams;

      const previousAgency =
        await uow.agencyRepository.getById(previousAgencyId);
      if (!previousAgency) {
        throw errors.agency.notFound({ agencyId: previousAgencyId });
      }

      const agencyWithRights = await uow.agencyRepository.getById(agencyId);
      if (!agencyWithRights) {
        throw errors.agency.notFound({ agencyId });
      }

      const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

      const signatoriesRecipientsRoleAndEmail: { role: Role; email: Email }[] =
        uniq([
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
        ]);

      const agencyRecipientsRoleAndEmail: { role: Role; email: Email }[] = uniq(
        [
          ...agency.counsellorEmails.map(
            (counsellorEmail): { role: Role; email: Email } => ({
              role: "counsellor",
              email: counsellorEmail,
            }),
          ),
          ...agency.validatorEmails.map(
            (validatorEmail): { role: Role; email: Email } => ({
              role: "validator",
              email: validatorEmail,
            }),
          ),
        ],
      );

      await Promise.all([
        ...sendAgencyEmails(
          agencyRecipientsRoleAndEmail,
          convention,
          uow,
          justification,
          previousAgency.name,
          {
            config: deps.config,
            timeGateway: deps.timeGateway,
            generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
            shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
            saveNotificationAndRelatedEvent:
              deps.saveNotificationAndRelatedEvent,
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
            saveNotificationAndRelatedEvent:
              deps.saveNotificationAndRelatedEvent,
          },
        ),
      ]);
    },
  );

const sendAgencyEmails = (
  agencyRecipientsRoleAndEmail: { role: Role; email: Email }[],
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
  return agencyRecipientsRoleAndEmail.map(async (emailAndRole) => {
    const { role, email } = emailAndRole;
    const makeShortMagicLink = prepareMagicShortLinkMaker({
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
        kind: "CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION",
        recipients: [email],
        params: {
          internshipKind: convention.internshipKind,
          beneficiaryEmail: convention.signatories.beneficiary.email,
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          beneficiaryPhone: convention.signatories.beneficiary.phone,
          previousAgencyName,
          justification,
          magicLink: shortLink,
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
  signatoriesRecipientsRoleAndEmail: { role: Role; email: Email }[],
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
    const makeShortMagicLink = prepareMagicShortLinkMaker({
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
