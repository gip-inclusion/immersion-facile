import {
  DiscussionDto,
  DiscussionId,
  InclusionConnectDomainJwtPayload,
  discussionIdSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../../core/UseCase";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

export class GetDiscussionByIdForEstablishment extends TransactionalUseCase<
  DiscussionId,
  DiscussionDto | undefined,
  InclusionConnectDomainJwtPayload
> {
  inputSchema = discussionIdSchema;
  protected async _execute(
    discussionId: DiscussionId,
    uow: UnitOfWork,
    jwtPayload?: InclusionConnectDomainJwtPayload,
  ): Promise<DiscussionDto | undefined> {
    if (!jwtPayload)
      throw new ForbiddenError("Inclusion connect payload is needed");

    const user = await uow.inclusionConnectedUserRepository.getById(
      jwtPayload.userId,
    );

    if (!user)
      throw new NotFoundError(
        `Inclusion Connected user with id ${jwtPayload.userId} not found`,
      );

    const discussion = await uow.discussionRepository.getById(discussionId);

    if (!discussion)
      throw new NotFoundError(
        `Could not find discussion with id ${discussionId}`,
      );

    if (discussion.establishmentContact.email !== user.email)
      throw new ForbiddenError(
        `You are not allowed to access discussion with id ${discussionId}`,
      );

    return discussion;
  }
}
