import {
  type ConnectedUserDomainJwtPayload,
  type DiscussionEstablishmentContactInfo,
  type DiscussionId,
  discussionIdSchema,
  errors,
} from "shared";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import type { EstablishmentAdminRight } from "../../entities/EstablishmentAggregate";
import { hasUserRightToAccessDiscussion } from "../../helpers/discussion.utils";

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

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        discussion.siret,
      );
    if (!establishmentAggregate)
      throw errors.establishment.notFound({ siret: discussion.siret });

    if (
      !(await hasUserRightToAccessDiscussion(
        user,
        discussion,
        establishmentAggregate.userRights,
      ))
    )
      throw errors.discussion.accessForbidden({
        discussionId: inputParams,
        userId: currentUser.userId,
      });

    const adminRightsWithAcceptedStatus: EstablishmentAdminRight[] =
      establishmentAggregate.userRights.filter(
        (right): right is EstablishmentAdminRight =>
          right.role === "establishment-admin" && right.status === "ACCEPTED",
      );
    if (adminRightsWithAcceptedStatus.length === 0)
      throw errors.establishment.adminNotFound({ siret: discussion.siret });

    const mainContactRight =
      adminRightsWithAcceptedStatus.find(
        (right) => right.isMainContactByPhone,
      ) ?? adminRightsWithAcceptedStatus[0];

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
        isMainContactByPhone: mainContactRight.isMainContactByPhone ?? false,
      },
    };
  });
