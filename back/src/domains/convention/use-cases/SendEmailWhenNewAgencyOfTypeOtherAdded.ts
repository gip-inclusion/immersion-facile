import {
  errors,
  getCounsellorsAndValidatorsEmailsDeduplicated,
  withAgencyIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type SendEmailWhenNewAgencyOfTypeOtherAdded = ReturnType<
  typeof makeSendEmailWhenNewAgencyOfTypeOtherAdded
>;

export const makeSendEmailWhenNewAgencyOfTypeOtherAdded = useCaseBuilder(
  "SendEmailWhenNewAgencyOfTypeOtherAdded",
)
  .withInput(withAgencyIdSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(async ({ inputParams: { agencyId }, uow, deps }) => {
    const agencyWithRights = await uow.agencyRepository.getById(agencyId);
    if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);
    if (agency.refersToAgencyId) return;
    if (agency.kind !== "autre") return;

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_OF_TYPE_OTHER_ADDED",
        recipients: getCounsellorsAndValidatorsEmailsDeduplicated(agency),
        params: {
          agencyName: agency.name,
          agencyLogoUrl: agency.logoUrl ?? undefined,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    });
  });
