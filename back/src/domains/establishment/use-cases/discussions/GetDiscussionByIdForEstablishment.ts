import {
  DiscussionDto,
  DiscussionId,
  DiscussionReadDto,
  InclusionConnectDomainJwtPayload,
  discussionIdSchema,
  errors,
} from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { UserOnRepository } from "../../../core/authentication/inclusion-connect/port/UserRepository";
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

  async #hasUserRightToAccessDiscussion(
    uow: UnitOfWork,
    user: UserOnRepository,
    discussion: DiscussionDto,
  ): Promise<boolean> {
    if (
      discussion.establishmentContact.email === user.email ||
      discussion.establishmentContact.copyEmails.includes(user.email)
    )
      return true;

    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        discussion.siret,
      );

    if (!establishment)
      throw errors.establishment.notFound({ siret: discussion.siret });
    return establishment.userRights.some((right) => right.userId === user.id);
  }
}
