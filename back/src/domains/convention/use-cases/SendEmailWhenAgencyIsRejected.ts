import { toPairs, uniq } from "ramda";
import {
  type AgencyStatus,
  errors,
  isTruthy,
  type UserId,
  withAgencyIdSchema,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type SendEmailWhenAgencyIsRejected = ReturnType<
  typeof makeSendEmailWhenAgencyIsRejected
>;

export const makeSendEmailWhenAgencyIsRejected = useCaseBuilder(
  "SendEmailWhenAgencyIsRejected",
)
  .withInput(withAgencyIdSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(async ({ inputParams: { agencyId }, uow, deps }) => {
    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId });
    const rejectedStatus: AgencyStatus = "rejected";
    if (agency.status !== rejectedStatus)
      throw errors.agency.invalidStatus({
        id: agencyId,
        actual: agency.status,
        expected: rejectedStatus,
      });
    if (!agency.statusJustification)
      throw errors.agency.notRejected({ agencyId });

    const referedAgency = agency.refersToAgencyId
      ? await uow.agencyRepository.getById(agency.refersToAgencyId)
      : undefined;

    const userIdsToNotify: UserId[] = uniq(
      [
        ...toPairs(agency.usersRights),
        ...(referedAgency
          ? toPairs(referedAgency.usersRights).filter(([_, rights]) =>
              rights?.roles.includes("agency-admin"),
            )
          : []),
      ]
        .filter(([_, rights]) => rights?.isNotifiedByEmail)
        .map(([userId]) => userId)
        .filter(isTruthy),
    );

    const users = await uow.userRepository.getByIds(userIdsToNotify);

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_WAS_REJECTED",
        recipients: users.map((user) => user.email),
        params: {
          agencyName: agency.name,
          statusJustification: agency.statusJustification,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    });
  });
