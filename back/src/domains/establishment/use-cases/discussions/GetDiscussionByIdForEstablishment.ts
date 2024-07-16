import {
  DiscussionId,
  DiscussionReadDto,
  InclusionConnectDomainJwtPayload,
  discussionIdSchema,
} from "shared";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
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
    if (!jwtPayload) throw new UnauthorizedError();

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

    const { appellationCode, ...rest } = discussion;

    const appellation = (
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
        appellationCode,
      ])
    ).at(0);

    if (!appellation)
      throw new NotFoundError(`Missing appelation code '${appellationCode}'`);

    return {
      ...rest,
      appellation,
      potentialBeneficiary: {
        firstName: discussion.potentialBeneficiary.firstName,
        lastName: discussion.potentialBeneficiary.lastName,
        resumeLink: discussion.potentialBeneficiary.resumeLink,
        email: discussion.potentialBeneficiary.email,
        phone: discussion.potentialBeneficiary.phone,
      },
      establishmentContact: {
        firstName: discussion.establishmentContact.firstName,
        lastName: discussion.establishmentContact.lastName,
        job: discussion.establishmentContact.job,
        contactMethod: discussion.establishmentContact.contactMethod,
      },
    };
  }
}
