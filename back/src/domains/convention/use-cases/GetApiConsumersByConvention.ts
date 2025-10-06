import {
  type AgencyKind,
  type ApiConsumerName,
  type ConnectedUser,
  errors,
  userHasEnoughRightsOnConvention,
  type WithConventionId,
  withConventionIdSchema,
} from "shared";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetApiConsumersByConvention = ReturnType<
  typeof makeGetApiConsumersByConvention
>;
export const makeGetApiConsumersByConvention = useCaseBuilder(
  "GetApiConsumersByConvention",
)
  .withInput<WithConventionId>(withConventionIdSchema)
  .withOutput<ApiConsumerName[]>()
  .withCurrentUser<ConnectedUser>()

  .build(async ({ uow, currentUser, inputParams: { conventionId } }) => {
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

    const conventionApiConsurmers = (
      await uow.apiConsumerRepository.getByFilters({
        agencyIds: [agency.id],
        agencyKinds: [agency.kind],
      })
    ).filter(
      (apiConsumer) => apiConsumer.rights.convention.subscriptions.length !== 0,
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
  });
