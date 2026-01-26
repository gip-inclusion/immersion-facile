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
import { validateAndParseZodSchema } from "../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../utils/logger";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type GetDiscussionByIdForEstablishment = ReturnType<
  typeof makeGetDiscussionByIdForEstablishment
>;

export const makeGetDiscussionByIdForEstablishment = useCaseBuilder(
  "GetDiscussionByIdForEstablishment",
)
  .withInput<DiscussionId>(discussionIdSchema)
  .withOutput<DiscussionReadDto>()
  .withCurrentUser<ConnectedUserDomainJwtPayload>()
  .build(async ({ inputParams, uow, currentUser }) => {
    const user = await uow.userRepository.getById(currentUser.userId);

    if (!user) throw errors.user.notFound({ userId: currentUser.userId });

    const discussion = await uow.discussionRepository.getById(inputParams);

    if (!discussion)
      throw errors.discussion.notFound({ discussionId: inputParams });

    if (!(await hasUserRightToAccessDiscussion(uow, user, discussion)))
      throw errors.discussion.accessForbidden({
        discussionId: inputParams,
        userId: currentUser.userId,
      });
    return makeDiscussionRead(discussion, uow);
  });

const makeDiscussionRead = async (
  discussion: DiscussionDto,
  uow: UnitOfWork,
): Promise<DiscussionReadDto> => {
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

  return validateAndParseZodSchema({
    schemaName: "discussionReadSchema",
    inputSchema: discussionReadSchema,
    schemaParsingInput: discussionRead,
    logger: createLogger(__filename),
  });
};

const hasUserRightToAccessDiscussion = async (
  uow: UnitOfWork,
  user: User,
  discussion: DiscussionDto,
): Promise<boolean> => {
  const establishment =
    await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
      discussion.siret,
    );

  if (!establishment)
    throw errors.establishment.notFound({ siret: discussion.siret });
  return establishment.userRights.some((right) => right.userId === user.id);
};
