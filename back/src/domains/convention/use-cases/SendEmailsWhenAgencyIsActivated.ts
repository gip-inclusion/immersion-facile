import {
  AgencyDto,
  UserParamsForMail,
  agencySchema,
  errors,
  getCounsellorsAndValidatorsEmailsDeduplicated,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type WithAgency = { agency: AgencyDto };

export class SendEmailsWhenAgencyIsActivated extends TransactionalUseCase<WithAgency> {
  protected inputSchema = z.object({ agency: agencySchema });

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { agency }: WithAgency,
    uow: UnitOfWork,
  ): Promise<void> {
    const provider = oAuthProviderByFeatureFlags(
      await uow.featureFlagRepository.getAll(),
    );

    const users = await uow.userRepository.getIcUsersWithFilter(
      { agencyId: agency.id },
      provider,
    );

    if (users.length === 0)
      throw errors.agency.usersNotFound({ agencyId: agency.id });

    const usersInfo: UserParamsForMail[] = users
      .filter(
        (user) =>
          !agency.refersToAgencyId ||
          user.agencyRights.some(
            (agencyRight) =>
              agencyRight.agency.id === agency.id &&
              agencyRight.roles.includes("counsellor"),
          ),
      )
      .map(({ firstName, lastName, agencyRights, email, id }) => {
        const agencyRight = agencyRights.find(
          (agencyRight) => agencyRight.agency.id === agency.id,
        );
        if (!agencyRight)
          throw errors.user.noRightsOnAgency({
            agencyId: agency.id,
            userId: id,
          });
        return {
          firstName,
          lastName,
          email,
          agencyName: agencyRight.agency.name,
          isNotifiedByEmail: agencyRight.isNotifiedByEmail,
          roles: agencyRight.roles,
        };
      });

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_WAS_ACTIVATED",
        recipients: agency.refersToAgencyId
          ? agency.counsellorEmails
          : getCounsellorsAndValidatorsEmailsDeduplicated(agency),
        params: {
          agencyName: agency.name,
          agencyLogoUrl: agency.logoUrl ?? undefined,
          users: usersInfo,
          agencyReferdToName: agency.refersToAgencyName ?? undefined,
          refersToOtherAgency: !!agency.refersToAgencyId,
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

      this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "AGENCY_WITH_REFERS_TO_ACTIVATED",
          recipients: agencyReferredTo.validatorEmails,
          params: {
            nameOfAgencyRefering: agency.name,
            agencyLogoUrl: agencyReferredTo.logoUrl ?? undefined,
            refersToAgencyName: agencyReferredTo.name,
            validatorEmails: agencyReferredTo.validatorEmails,
          },
        },
        followedIds: {
          agencyId: agency.id,
        },
      });
    }
  }
}
