import {
  type ConnectedUserDomainJwtPayload,
  type DiscussionDto,
  type DiscussionId,
  type DiscussionReadDto,
  discussionIdSchema,
  discussionReadSchema,
  errors,
  type User,
} from "shared";
import { validateAndParseZodSchemaV2 } from "../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../utils/logger";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

export class GetDiscussionByIdForEstablishment extends TransactionalUseCase<
  DiscussionId,
  DiscussionReadDto,
  ConnectedUserDomainJwtPayload
> {
  inputSchema = discussionIdSchema;
  protected async _execute(
    discussionId: DiscussionId,
    uow: UnitOfWork,
    jwtPayload?: ConnectedUserDomainJwtPayload,
  ): Promise<DiscussionReadDto> {
    if (!jwtPayload) throw errors.user.unauthorized();
    const user = await uow.userRepository.getById(jwtPayload.userId);

    if (!user) throw errors.user.notFound({ userId: jwtPayload.userId });

    const discussion = await uow.discussionRepository.getById(discussionId);

    if (!discussion) throw errors.discussion.notFound({ discussionId });

    if (!(await this.#hasUserRightToAccessDiscussion(uow, user, discussion)))
      throw errors.discussion.accessForbidden({
        discussionId,
        userId: jwtPayload.userId,
      });
    return this.makeDiscussionRead(discussion, uow);
  }

  private async makeDiscussionRead(
    discussion: DiscussionDto,
    uow: UnitOfWork,
  ): Promise<DiscussionReadDto> {
    const { appellationCode, ...rest } = discussion;

    const appellation = (
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        [appellationCode],
      )
    ).at(0);

    if (!appellation) throw errors.rome.missingAppellation({ appellationCode });
    const discussionRead = {
      ...rest,
      appellation,
    };

    return validateAndParseZodSchemaV2({
      schemaName: "discussionReadSchema",
      inputSchema: discussionReadSchema,
      schemaParsingInput: discussionRead,
      logger: createLogger(__filename),
    });
  }

  async #hasUserRightToAccessDiscussion(
    uow: UnitOfWork,
    user: User,
    discussion: DiscussionDto,
  ): Promise<boolean> {
    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        discussion.siret,
      );

    if (!establishment)
      throw errors.establishment.notFound({ siret: discussion.siret });
    return establishment.userRights.some((right) => right.userId === user.id);
  }
}
