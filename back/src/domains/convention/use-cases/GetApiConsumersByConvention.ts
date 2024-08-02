import {
  AgencyDto,
  ApiConsumer,
  ApiConsumerName,
  InclusionConnectedUser,
  WithConventionId,
  errors,
  userHasEnoughRightsOnConvention,
  withConventionIdSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";

export type GetApiConsumersByconvention = ReturnType<
  typeof makeGetApiConsumersByconvention
>;
export const makeGetApiConsumersByconvention = createTransactionalUseCase<
  WithConventionId,
  ApiConsumerName[],
  InclusionConnectedUser
>(
  {
    name: "GetApiConsumersByconvention",
    inputSchema: withConventionIdSchema,
  },
  async ({ uow, currentUser, inputParams: { conventionId } }) => {
    const convention = await uow.conventionRepository.getById(conventionId);

    if (!convention)
      throw errors.convention.notFound({
        conventionId,
      });

    const user = await uow.inclusionConnectedUserRepository.getById(
      currentUser.id,
    );

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
    return [
      ...conventionApiConsurmers.map(
        (conventionApiConsurmer) => conventionApiConsurmer.name,
      ),
      ...(agency.kind === "pole-emploi" ? ["France Travail"] : []),
    ];
  },
);

const isConventionInScope = (
  apiConsumer: ApiConsumer,
  conventionAgency: AgencyDto,
) => {
  return (
    apiConsumer.rights.convention.scope.agencyKinds?.includes(
      conventionAgency.kind,
    ) ||
    apiConsumer.rights.convention.scope.agencyIds?.includes(conventionAgency.id)
  );
};
