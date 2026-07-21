import {
  type ConnectedUserDomainJwtPayload,
  type DiscussionEstablishmentContactInfo,
  type DiscussionId,
  discussionIdSchema,
  errors,
} from "shared";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import { hasUserRightToAccessDiscussion } from "./GetDiscussionById";

export type GetDiscussionEstablishmentContactInfo = ReturnType<
  typeof makeGetDiscussionEstablishmentContactInfo
>;

export const makeGetDiscussionEstablishmentContactInfo = useCaseBuilder(
  "GetDiscussionEstablishmentContactInfo",
)
  .withInput<DiscussionId>(discussionIdSchema)
  .withOutput<DiscussionEstablishmentContactInfo>()
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

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        discussion.siret,
      );
    if (!establishmentAggregate)
      throw errors.establishment.notFound({ siret: discussion.siret });

    const adminRights = establishmentAggregate.userRights.filter(
      (right) => right.role === "establishment-admin",
    );
    if (adminRights.length === 0)
      throw errors.establishment.adminNotFound({ siret: discussion.siret });

    const mainContactRight =
      adminRights.find((right) => right.isMainContactByPhone) ?? adminRights[0];

    const mainContactUser = await uow.userRepository.getById(
      mainContactRight.userId,
    );
    if (!mainContactUser)
      throw errors.user.notFound({ userId: mainContactRight.userId });

    return {
      siret: discussion.siret,
      potentialBeneficiaryWelcomeAddress:
        establishmentAggregate.establishment.potentialBeneficiaryWelcomeAddress,
      mainContact: {
        firstName: mainContactUser.firstName,
        lastName: mainContactUser.lastName,
        phone: mainContactRight.phone,
      },
    } satisfies DiscussionEstablishmentContactInfo;
  });
