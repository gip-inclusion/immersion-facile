import {
  AgencyDto,
  AgencyId,
  AgencyRight,
  InclusionConnectedUser,
  WithAgencyId,
  errors,
  withAgencyIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

const addValidatorsNotReceivingNotifications = async (
  uow: UnitOfWork,
  agencyId: AgencyId,
  agenciesWithRefersTo: AgencyDto[],
) => {
  const provider = oAuthProviderByFeatureFlags(
    await uow.featureFlagRepository.getAll(),
  );

  const validatorsNotNotifiedToCopy =
    await uow.userRepository.getIcUsersWithFilter(
      {
        agencyId: agencyId,
        agencyRole: "validator",
        isNotifiedByEmail: false,
      },
      provider,
    );

  const updatedUsers: InclusionConnectedUser[] =
    validatorsNotNotifiedToCopy.map((user) => {
      const newOrUpdatedAgencyRights: AgencyRight[] = agenciesWithRefersTo.map(
        (agency) => {
          const agencyRightToUpdate = user.agencyRights.find(
            (agencyRight) => agencyRight.agency.id === agency.id,
          );
          const updatedAgencyRight: AgencyRight = {
            agency,
            isNotifiedByEmail: false,
            roles:
              agencyRightToUpdate !== undefined
                ? [...agencyRightToUpdate.roles, "validator"]
                : ["validator"],
          };

          return updatedAgencyRight;
        },
      );

      const newOrUpdatedAgencyRightsAgencyIds = newOrUpdatedAgencyRights.map(
        (agencyRight) => agencyRight.agency.id,
      );

      return {
        ...user,
        agencyRights: [
          ...user.agencyRights.filter(
            (agencyRight) =>
              !newOrUpdatedAgencyRightsAgencyIds.includes(
                agencyRight.agency.id,
              ),
          ),
          ...newOrUpdatedAgencyRights,
        ],
      };
    });

  await Promise.all(
    updatedUsers.map((user) =>
      uow.userRepository.updateAgencyRights({
        userId: user.id,
        agencyRights: user.agencyRights,
      }),
    ),
  );
};

export class UpdateAgencyReferringToUpdatedAgency extends TransactionalUseCase<
  WithAgencyId,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = withAgencyIdSchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(params: WithAgencyId, uow: UnitOfWork): Promise<void> {
    const agencyUpdated = await uow.agencyRepository.getById(params.agencyId);

    if (!agencyUpdated) throw errors.agency.notFound(params);
    const updatedRelatedAgencies: AgencyDto[] = (
      await uow.agencyRepository.getAgenciesRelatedToAgency(agencyUpdated.id)
    ).map((agency) => ({
      ...agency,
      validatorEmails: agencyUpdated.validatorEmails,
    }));

    await addValidatorsNotReceivingNotifications(
      uow,
      agencyUpdated.id,
      updatedRelatedAgencies,
    );

    await Promise.all(
      updatedRelatedAgencies.flatMap((agency) => [
        uow.agencyRepository.update(agency),
        uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agencyId: agency.id,
              triggeredBy: {
                kind: "crawler",
              },
            },
          }),
        ),
      ]),
    );
  }
}
