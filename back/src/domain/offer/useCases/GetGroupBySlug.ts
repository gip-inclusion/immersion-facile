import { GroupWithResults, WithGroupSlug, withGroupSlugSchema } from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetOffersByGroupSlug extends TransactionalUseCase<
  WithGroupSlug,
  GroupWithResults
> {
  protected inputSchema = withGroupSlugSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(
    { groupSlug }: WithGroupSlug,
    uow: UnitOfWork,
  ): Promise<GroupWithResults> {
    const results = await uow.groupRepository.findSearchResultsBySlug(
      groupSlug,
    );
    return {
      group: {
        name: "Mon group de ouf",
        slug: "group-slug",
        options: {
          heroHeader: {
            title: "group title",
            description: "group description",
            logoUrl: "http://yolo.com",
            backgroundColor: "red",
          },
          tintColor: "#0082c3",
        },
      },
      results,
    };
  }
}
