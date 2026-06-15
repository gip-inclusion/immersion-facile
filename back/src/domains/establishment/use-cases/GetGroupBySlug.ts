import { errors, type GroupWithResults, withGroupSlugSchema } from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetOffersByGroupSlug = ReturnType<typeof makeGetOffersByGroupSlug>;

export const makeGetOffersByGroupSlug = useCaseBuilder("GetOffersByGroupSlug")
  .withInput(withGroupSlugSchema)
  .withOutput<GroupWithResults>()
  .build(async ({ inputParams: { groupSlug }, uow }) => {
    const groupWithResults =
      await uow.groupRepository.getGroupWithSearchResultsBySlug(groupSlug);

    if (!groupWithResults)
      throw errors.establishmentGroup.missingBySlug({ groupSlug });

    return groupWithResults;
  });
