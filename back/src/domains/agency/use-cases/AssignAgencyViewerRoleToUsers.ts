import type { AgencyKind, UserId } from "shared";
import { agencyKindSchema, userIdSchema } from "shared";
import { z } from "zod";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type AssignAgencyViewerRoleInput = {
  userIds: UserId[];
  agencyKinds: AgencyKind[];
};

type AssignAgencyViewerRoleOutput = {
  agenciesSuccessfullyUpdated: number;
  agencyUpdatesFailed: number;
  agenciesSkipped: number;
};

const assignAgencyViewerRoleInputSchema = z.object({
  userIds: z.array(userIdSchema),
  agencyKinds: z.array(agencyKindSchema),
});

export class AssignAgencyViewerRole extends TransactionalUseCase<
  AssignAgencyViewerRoleInput,
  AssignAgencyViewerRoleOutput
> {
  protected inputSchema = assignAgencyViewerRoleInputSchema;
  #timeGateway: TimeGateway;

  constructor(uowPerformer: UnitOfWorkPerformer, timeGateway: TimeGateway) {
    super(uowPerformer);
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { userIds, agencyKinds }: AssignAgencyViewerRoleInput,
    uow: UnitOfWork,
  ): Promise<AssignAgencyViewerRoleOutput> {
    const users = await uow.userRepository.getByIds(userIds);

    if (users.length === 0) {
      return {
        agenciesSuccessfullyUpdated: 0,
        agencyUpdatesFailed: 0,
        agenciesSkipped: 0,
      };
    }

    const targetAgencies = await uow.agencyRepository.getAgencies({
      filters: {
        kinds: agencyKinds,
        status: ["active", "from-api-PE"],
      },
    });

    let agenciesSuccessfullyUpdated = 0;
    let agencyUpdatesFailed = 0;
    let agenciesSkipped = 0;

    await Promise.all(
      targetAgencies.map(async (agency) => {
        const updatedUsersRights = { ...agency.usersRights };
        let hasChanges = false;

        users.forEach((user) => {
          const existingRight = agency.usersRights[user.id];

          if (existingRight?.roles.includes("agency-viewer")) {
            return;
          }

          updatedUsersRights[user.id] = existingRight
            ? {
                roles: [...existingRight.roles, "agency-viewer"],
                isNotifiedByEmail: existingRight.isNotifiedByEmail,
              }
            : {
                roles: ["agency-viewer"],
                isNotifiedByEmail: false,
              };

          hasChanges = true;
        });

        if (hasChanges) {
          const phoneId = await uow.phoneNumberRepository.getIdByPhoneNumber(
            agency.phoneNumber,
            this.#timeGateway.now(),
          );
          return uow.agencyRepository
            .update({
              partialAgency: {
                id: agency.id,
                usersRights: updatedUsersRights,
              },
              newPhoneId: phoneId,
            })
            .then(() => {
              agenciesSuccessfullyUpdated++;
            })
            .catch((error) => {
              agencyUpdatesFailed++;
              console.error(
                `Failed to update agency ${agency.id} with user rights:`,
                error,
              );
            });
        }
        agenciesSkipped++;
      }),
    );

    return {
      agenciesSuccessfullyUpdated,
      agencyUpdatesFailed,
      agenciesSkipped,
    };
  }
}
