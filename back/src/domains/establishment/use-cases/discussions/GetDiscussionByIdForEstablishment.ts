import {
  DiscussionDto,
  DiscussionId,
  DiscussionReadDto,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  discussionIdSchema,
  errors,
} from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { makeProvider } from "../../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

export class GetDiscussionByIdForEstablishment extends TransactionalUseCase<
  DiscussionId,
  DiscussionReadDto,
  InclusionConnectDomainJwtPayload
> {
  inputSchema = discussionIdSchema;
  protected async _execute(
    discussionId: DiscussionId,
    uow: UnitOfWork,
    jwtPayload?: InclusionConnectDomainJwtPayload,
  ): Promise<DiscussionReadDto> {
    if (!jwtPayload) throw errors.user.unauthorized();
    const provider = await makeProvider(uow);
    const user = await uow.userRepository.getById(jwtPayload.userId, provider);

    if (!user) throw errors.user.notFound({ userId: jwtPayload.userId });

    const discussion = await uow.discussionRepository.getById(discussionId);

    if (!discussion) throw errors.discussion.notFound({ discussionId });

    if (!this.#hasUserRightToAccessDiscussion(user, discussion))
      throw errors.discussion.accessForbidden({
        discussionId,
        userId: jwtPayload.userId,
      });

    const { appellationCode, ...rest } = discussion;

    const appellation = (
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
        appellationCode,
      ])
    ).at(0);

    if (!appellation)
      throw errors.discussion.missingAppellationLabel({ appellationCode });

    return {
      ...rest,
      appellation,
      potentialBeneficiary: {
        firstName: discussion.potentialBeneficiary.firstName,
        lastName: discussion.potentialBeneficiary.lastName,
        resumeLink: discussion.potentialBeneficiary.resumeLink,
        email: discussion.potentialBeneficiary.email,
        phone: discussion.potentialBeneficiary.phone,
        hasWorkingExperience:
          discussion.potentialBeneficiary.hasWorkingExperience,
        experienceAdditionalInformation:
          discussion.potentialBeneficiary.experienceAdditionalInformation,
        datePreferences: discussion.potentialBeneficiary.datePreferences,
      },
      establishmentContact: {
        firstName: discussion.establishmentContact.firstName,
        lastName: discussion.establishmentContact.lastName,
        job: discussion.establishmentContact.job,
        contactMethod: discussion.establishmentContact.contactMethod,
      },
    };
  }
  #hasUserRightToAccessDiscussion(
    user: InclusionConnectedUser,
    discussion: DiscussionDto,
  ) {
    return (
      discussion.establishmentContact.email === user.email ||
      discussion.establishmentContact.copyEmails.includes(user.email)
    );
  }
}
