import {
  type ConnectedUserDomainJwtPayload,
  type DiscussionDto,
  type DiscussionId,
  type DiscussionReadDto,
  discussionIdSchema,
  discussionReadSchema,
  errors,
} from "shared";
import { validateAndParseZodSchema } from "../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../utils/logger";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type GetDiscussionByIdForPotentialBeneficiary = ReturnType<
  typeof makeGetDiscussionByIdForPotentialBeneficiary
>;

export const makeGetDiscussionByIdForPotentialBeneficiary = useCaseBuilder(
  "GetDiscussionByIdForPotentialBeneficiary",
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

    if (!hasUserRightToAccessDiscussion(user.email, discussion))
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

const hasUserRightToAccessDiscussion = (
  userEmail: string,
  discussion: DiscussionDto,
): boolean => userEmail === discussion.potentialBeneficiary.email;
