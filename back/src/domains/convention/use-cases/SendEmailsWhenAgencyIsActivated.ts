import { toPairs } from "ramda";
import {
  errors,
  frontRoutes,
  getCounsellorsAndValidatorsEmailsDeduplicated,
  type UserId,
  withAgencyIdSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type SendEmailsWhenAgencyIsActivated = ReturnType<
  typeof makeSendEmailsWhenAgencyIsActivated
>;
export const makeSendEmailsWhenAgencyIsActivated = useCaseBuilder(
  "SendEmailsWhenAgencyIsActivated",
)
  .withInput(withAgencyIdSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    config: AppConfig;
  }>()
  .build(
    async ({
      inputParams: { agencyId },
      uow,
      deps: { saveNotificationAndRelatedEvent, config },
    }) => {
      const agency = await uow.agencyRepository.getById(agencyId);
      if (!agency) throw errors.agency.notFound({ agencyId });

      const agencyDto = await agencyWithRightToAgencyDto(uow, agency);

      const userIds: UserId[] = toPairs(agency.usersRights).map(
        (userIdAndRights) => userIdAndRights[0],
      );

      const users = await uow.userRepository.getByIds(userIds);

      if (users.length === 0)
        throw errors.agency.usersNotFound({ agencyId: agency.id });

      await saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "AGENCY_WAS_ACTIVATED",
          recipients: agency.refersToAgencyId
            ? agencyDto.counsellorEmails
            : getCounsellorsAndValidatorsEmailsDeduplicated(agencyDto),
          params: {
            agencyName: agency.name,
            agencyLogoUrl: agency.logoUrl ?? undefined,
            agencyReferdToName: agency.refersToAgencyName ?? undefined,
            refersToOtherAgency: !!agency.refersToAgencyId,
            agencyDashboardUrl: `${config.immersionFacileBaseUrl}/${frontRoutes.agencyDashboard}/dashboard`,
          },
        },
        followedIds: {
          agencyId: agency.id,
        },
      });

      if (agency.refersToAgencyId) {
        const agencyReferredTo = await uow.agencyRepository.getById(
          agency.refersToAgencyId,
        );
        if (!agencyReferredTo)
          throw errors.agency.notFound({ agencyId: agency.refersToAgencyId });

        const agencyRefersToDto = await agencyWithRightToAgencyDto(
          uow,
          agencyReferredTo,
        );

        await saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "AGENCY_WITH_REFERS_TO_ACTIVATED",
            recipients: agencyRefersToDto.validatorEmails,
            params: {
              nameOfAgencyRefering: agency.name,
              agencyLogoUrl: agencyReferredTo.logoUrl ?? undefined,
              refersToAgencyName: agencyReferredTo.name,
              validatorEmails: agencyRefersToDto.validatorEmails,
            },
          },
          followedIds: {
            agencyId: agency.id,
          },
        });
      }
    },
  );
