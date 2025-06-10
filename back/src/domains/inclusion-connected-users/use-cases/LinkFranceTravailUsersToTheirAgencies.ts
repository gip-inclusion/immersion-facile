import { partition } from "ramda";
import {
  type AgencyGroup,
  type AgencyRight,
  type AgencyWithUsersRights,
  type UserWithRights,
  activeAgencyStatuses,
  agencyRoleIsNotToReview,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { z } from "zod";
import {
  getAgencyAndAdminEmailsByAgencyId,
  updateRightsOnMultipleAgenciesForUser,
} from "../../../utils/agency";
import { TransactionalUseCase } from "../../core/UseCase";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getUserWithRights } from "../helpers/userRights.helper";

export type UserAuthenticatedPayload = {
  userId: string;
  codeSafir: string | null; // Code safir non stocké en DB côté utilisateur
};

const userAuthenticatedSchema: z.Schema<UserAuthenticatedPayload> = z.object({
  userId: z.string(),
  codeSafir: z.string().or(z.null()),
});

export class LinkFranceTravailUsersToTheirAgencies extends TransactionalUseCase<UserAuthenticatedPayload> {
  inputSchema = userAuthenticatedSchema;
  #createNewEvent: CreateNewEvent;
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }
  protected async _execute(
    { userId, codeSafir }: UserAuthenticatedPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!codeSafir) return;
    const user = await getUserWithRights(uow, userId);
    if (isIcUserAlreadyHasValidRight(user, codeSafir)) return;

    const agencyWithSafir = await uow.agencyRepository.getBySafir(codeSafir);
    if (
      agencyWithSafir &&
      activeAgencyStatuses.includes(agencyWithSafir.status)
    )
      return updateActiveAgencyWithSafir(
        uow,
        agencyWithSafir,
        userId,
        this.#createNewEvent,
      );

    const groupWithSafir =
      await uow.agencyGroupRepository.getByCodeSafir(codeSafir);
    if (groupWithSafir) return updateAgenciesOfGroup(uow, groupWithSafir, user);
  }
}

const isIcUserAlreadyHasValidRight = (
  icUser: UserWithRights,
  codeSafir: string,
): boolean =>
  icUser.agencyRights.some(
    ({ agency, roles }) =>
      agency.codeSafir === codeSafir && agencyRoleIsNotToReview(roles),
  );

const updateActiveAgencyWithSafir = async (
  uow: UnitOfWork,
  agencyWithSafir: AgencyWithUsersRights,
  userId: string,
  createNewEvent: CreateNewEvent,
): Promise<void> => {
  await Promise.all([
    uow.agencyRepository.update({
      id: agencyWithSafir.id,
      usersRights: {
        ...agencyWithSafir.usersRights,
        [userId]: { roles: ["validator"], isNotifiedByEmail: false },
      },
    }),
    uow.outboxRepository.save(
      createNewEvent({
        topic: "AgencyUpdated",
        payload: {
          agencyId: agencyWithSafir.id,
          triggeredBy: {
            kind: "crawler",
          },
        },
      }),
    ),
  ]);
};

const updateAgenciesOfGroup = async (
  uow: UnitOfWork,
  agencyGroupWithSafir: AgencyGroup,
  user: UserWithRights,
): Promise<void> => {
  const agenciesRelatedToGroup = await uow.agencyRepository.getByIds(
    agencyGroupWithSafir.agencyIds,
  );

  const [agencyRightsWithConflicts, agencyRightsWithoutConflicts] = partition(
    ({ agency }) => agencyGroupWithSafir.agencyIds.includes(agency.id),
    user.agencyRights,
  );

  const agenciesWithAdminEmailsById = await getAgencyAndAdminEmailsByAgencyId({
    uow,
    agencyIds: agenciesRelatedToGroup.map(({ id }) => id),
  });

  const otherAgencyRights = await Promise.all(
    agenciesRelatedToGroup
      .filter((agency) => activeAgencyStatuses.includes(agency.status))
      .map(async (agency): Promise<AgencyRight> => {
        const existingAgencyRight = agencyRightsWithConflicts.find(
          (agencyRight) => agencyRight.agency.id === agency.id,
        );

        if (
          existingAgencyRight &&
          agencyRoleIsNotToReview(existingAgencyRight.roles)
        )
          return existingAgencyRight;

        return {
          agency: toAgencyDtoForAgencyUsersAndAdmins(
            agency,
            agenciesWithAdminEmailsById[agency.id].adminEmails,
          ),
          roles: ["agency-viewer"],
          isNotifiedByEmail: false,
        };
      }),
  );

  const agencyRightsForUser: AgencyRight[] = [
    ...agencyRightsWithoutConflicts,
    ...otherAgencyRights,
  ];

  return updateRightsOnMultipleAgenciesForUser(
    uow,
    user.id,
    agencyRightsForUser,
  );
};
