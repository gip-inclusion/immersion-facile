import {
  type AgencyKind,
  type AgencyWithUsersRights,
  type ApiConsumer,
  type ApiConsumerName,
  type ConnectedUser,
  errors,
  userHasEnoughRightsOnConvention,
  type WithConventionId,
  withConventionIdSchema,
} from "shared";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import { createTransactionalUseCase } from "../../core/UseCase";

export type GetApiConsumersByConvention = ReturnType<
  typeof makeGetApiConsumersByConvention
>;
export const makeGetApiConsumersByConvention = createTransactionalUseCase<
  WithConventionId,
  ApiConsumerName[],
  ConnectedUser
>(
  {
    name: "GetApiConsumersByConvention",
    inputSchema: withConventionIdSchema,
  },
  async ({ uow, currentUser, inputParams: { conventionId } }) => {
    const convention = await uow.conventionRepository.getById(conventionId);

    if (!convention)
      throw errors.convention.notFound({
        conventionId,
      });

    const user = await getUserWithRights(uow, currentUser.id);

    if (!user)
      throw errors.user.notFound({
        userId: currentUser.id,
      });

    const agency = await uow.agencyRepository.getById(convention.agencyId);

    if (!agency)
      throw errors.agency.notFound({
        agencyId: convention.agencyId,
      });

    if (
      !userHasEnoughRightsOnConvention(user, convention, [
        "counsellor",
        "validator",
      ])
    )
      return [];

    const apiConsumers = await uow.apiConsumerRepository.getAll();

    const conventionApiConsurmers = apiConsumers.filter(
      (apiConsumer) =>
        apiConsumer.rights.convention.subscriptions.length !== 0 &&
        isConventionInScope(apiConsumer, agency),
    );

    const agencyKindsAllowedToBroadcastToFT: AgencyKind[] = [
      "pole-emploi",
      "cap-emploi",
      "conseil-departemental",
    ];
    return [
      ...conventionApiConsurmers.map(({ name }) => name),
      ...(agencyKindsAllowedToBroadcastToFT.includes(agency.kind)
        ? ["France Travail"]
        : []),
    ];
  },
);

const isConventionInScope = (
  apiConsumer: ApiConsumer,
  conventionAgency: AgencyWithUsersRights,
) => {
  return (
    apiConsumer.rights.convention.scope.agencyKinds?.includes(
      conventionAgency.kind,
    ) ||
    apiConsumer.rights.convention.scope.agencyIds?.includes(conventionAgency.id)
  );
};
