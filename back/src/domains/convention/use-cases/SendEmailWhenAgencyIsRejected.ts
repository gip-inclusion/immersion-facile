import { toPairs, uniq } from "ramda";
import {
  AgencyStatus,
  UserId,
  WithAgencyId,
  errors,
  isTruthy,
  withAgencyIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SendEmailWhenAgencyIsRejected extends TransactionalUseCase<WithAgencyId> {
  protected inputSchema = withAgencyIdSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { agencyId }: WithAgencyId,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId });
    const rejectedStatus: AgencyStatus = "rejected";
    if (agency.status !== rejectedStatus)
      throw errors.agency.invalidStatus({
        id: agencyId,
        actual: agency.status,
        expected: rejectedStatus,
      });
    if (!agency.rejectionJustification)
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

    const users = await uow.userRepository.getByIds(
      userIdsToNotify,
      await makeProvider(uow),
    );

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_WAS_REJECTED",
        recipients: users.map((user) => user.email),
        params: {
          agencyName: agency.name,
          rejectionJustification: agency.rejectionJustification,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    });
  }
}
