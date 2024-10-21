import {
  AgencyDto,
  UserParamsForMail,
  agencySchema,
  WithAgencyId,
  errors,
  getCounsellorsAndValidatorsEmailsDeduplicated,
  withAgencyIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SendEmailsWhenAgencyIsActivated extends TransactionalUseCase<WithAgencyId> {
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
    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId });

    const agencyDto = await agencyWithRightToAgencyDto(uow, agency);

    const refersToOtherAgencyParams = agency.refersToAgencyId
      ? {
          refersToOtherAgency: true as const,
          validatorEmails: agencyDto.validatorEmails,
        }
      : { refersToOtherAgency: false as const };

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_WAS_ACTIVATED",
        recipients: agency.refersToAgencyId
          ? agencyDto.counsellorEmails
          : getCounsellorsAndValidatorsEmailsDeduplicated(agencyDto),
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

      const agencyRefersToDto = await agencyWithRightToAgencyDto(
        uow,
        agencyReferredTo,
      );

      this.#saveNotificationAndRelatedEvent(uow, {
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
  }
}
