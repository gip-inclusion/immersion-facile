import {
  BackOfficeJwtPayload,
  ConventionId,
  ConventionMagicLinkPayload,
  ConventionReadDto,
  InclusionConnectDomainJwtPayload,
  WithConventionId,
  withConventionIdSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

type AuthPayload =
  | BackOfficeJwtPayload
  | ConventionMagicLinkPayload
  | InclusionConnectDomainJwtPayload;

export class GetConvention extends TransactionalUseCase<
  WithConventionId,
  ConventionReadDto,
  AuthPayload
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = withConventionIdSchema;

  public async _execute(
    { conventionId }: WithConventionId,
    uow: UnitOfWork,
    authPayload: AuthPayload,
  ): Promise<ConventionReadDto> {
    await this.throwIfNotAllowed(uow, authPayload, conventionId);
    const convention = await uow.conventionQueries.getConventionById(
      conventionId,
    );
    if (!convention)
      throw new NotFoundError(`No convention found with id ${conventionId}`);
    return convention;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async throwIfNotAllowed(
    uow: UnitOfWork,
    authPayload: AuthPayload | undefined,
    conventionId: ConventionId,
  ): Promise<void | never> {
    if (!authPayload) throw new ForbiddenError(`No auth payload provided`);
    if ("role" in authPayload) {
      if (authPayload.role === "backOffice") return;
      if (authPayload.applicationId !== conventionId) {
        throw new ForbiddenError(
          `This token is not allowed to access convention with id ${conventionId}. Role was '${authPayload.role}'`,
        );
      }
      return;
    }

    const userIsAllowed =
      await uow.inclusionConnectedUserRepository.isUserAllowedToAccessConvention(
        authPayload.userId,
        conventionId,
      );

    if (!userIsAllowed) {
      throw new ForbiddenError(
        `User with id '${authPayload.userId}' is not allowed to access convention with id '${conventionId}'`,
      );
    }
  }
}
