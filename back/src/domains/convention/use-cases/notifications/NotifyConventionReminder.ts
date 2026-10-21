import { uniq } from "ramda";
import {
  type AgencyDto,
  type ConventionDto,
  type Email,
  errors,
  frontRoutes,
  getDisplayedBusinessName,
  getFormattedFirstnameAndLastname,
  makeRouteAbsoluteUrl,
  type ReminderKind,
  type TemplatedEmail,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { conventionReminderPayloadSchema } from "../../../core/events/eventPayload.schema";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyConventionReminder = ReturnType<
  typeof makeNotifyConventionReminder
>;

type Deps = {
  saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
  config: AppConfig;
};

export const makeNotifyConventionReminder = useCaseBuilder(
  "NotifyConventionReminder",
)
  .withInput(conventionReminderPayloadSchema)
  .withDeps<Deps>()
  .build(async ({ inputParams: { conventionId, reminderKind }, uow, deps }) => {
    const convention = await uow.conventionRepository.getById(conventionId);
    if (!convention) throw errors.convention.notFound({ conventionId });

    const agencyWithRights = await uow.agencyRepository.getById(
      convention.agencyId,
    );
    if (!agencyWithRights)
      throw errors.agency.notFound({
        agencyId: convention.agencyId,
      });

    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);
    if (convention.status !== "IN_REVIEW")
      throw errors.convention.forbiddenReminder({
        convention,
        kind: reminderKind,
      });

    const counsellorsAndValidatorsEmails = uniq([
      ...agency.validatorEmails,
      ...agency.counsellorEmails,
    ]);

    await deps.saveNotificationsBatchAndRelatedEvent(
      uow,
      counsellorsAndValidatorsEmails.map((counsellorOrValidatorEmail) =>
        createAgencyReminderEmail({
          counsellorOrValidatorEmail,
          convention,
          agency,
          reminderKind,
          config: deps.config,
        }),
      ),
    );
  });

const createAgencyReminderEmail = ({
  counsellorOrValidatorEmail,
  convention,
  agency,
  reminderKind,
  config,
}: {
  counsellorOrValidatorEmail: Email;
  convention: ConventionDto;
  agency: AgencyDto;
  reminderKind: ReminderKind;
  config: AppConfig;
}): NotificationContentAndFollowedIds => {
  const templatedEmail: TemplatedEmail =
    reminderKind === "FirstReminderForAgency"
      ? {
          kind: "AGENCY_FIRST_REMINDER",
          recipients: [counsellorOrValidatorEmail],
          params: {
            conventionId: convention.id,
            agencyName: agency.name,
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            businessName: getDisplayedBusinessName(convention),
            dateStart: convention.dateStart,
            dateEnd: convention.dateEnd,
            manageConventionLink: makeRouteAbsoluteUrl({
              route: frontRoutes.manageConventionConnectedUser({
                conventionId: convention.id,
                email: counsellorOrValidatorEmail,
              }),
              baseUrl: config.immersionFacileBaseUrl,
            }),
          },
        }
      : {
          kind: "AGENCY_LAST_REMINDER",
          recipients: [counsellorOrValidatorEmail],
          params: {
            conventionId: convention.id,
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            businessName: getDisplayedBusinessName(convention),
            manageConventionLink: makeRouteAbsoluteUrl({
              route: frontRoutes.manageConventionConnectedUser({
                conventionId: convention.id,
                email: counsellorOrValidatorEmail,
              }),
              baseUrl: config.immersionFacileBaseUrl,
            }),
          },
        };

  return {
    kind: "email",
    followedIds: {
      conventionId: convention.id,
      agencyId: agency.id,
      establishmentSiret: convention.siret,
    },
    templatedContent: templatedEmail,
  };
};
