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
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";

export type GetApiConsumersByConvention = ReturnType<
  typeof makeGetApiConsumersByConvention
>;
export const makeGetApiConsumersByConvention = createTransactionalUseCase<
  WithConventionId,
  ApiConsumerName[],
  InclusionConnectedUser
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

    const user = await uow.userRepository.getById(
      currentUser.id,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
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
      ...conventionApiConsurmers.map(({ name }) => name),
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
