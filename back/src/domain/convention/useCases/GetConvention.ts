import {
  ConventionId,
  ConventionJwtPayload,
  ConventionReadDto,
  getUserRoleForAccessingConvention,
  InclusionConnectJwtPayload,
  WithConventionId,
  withConventionIdSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetConvention extends TransactionalUseCase<
  WithConventionId,
  ConventionReadDto,
  ConventionJwtPayload
> {
  inputSchema = withConventionIdSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(
    { conventionId }: WithConventionId,
    uow: UnitOfWork,
    authPayload?: ConventionJwtPayload,
  ): Promise<ConventionReadDto> {
    const isInclusionConnectPayload = this.isInclusionConnectPayload(
      authPayload,
      conventionId,
    );

    const convention = await uow.conventionQueries.getConventionById(
      conventionId,
    );
    if (!convention)
      throw new NotFoundError(`No convention found with id ${conventionId}`);

    if (isInclusionConnectPayload) {
      const user = await uow.inclusionConnectedUserRepository.getById(
        authPayload.userId,
      );
      if (!user)
        throw new NotFoundError(
          `No user found with id '${authPayload.userId}'`,
        );

      const role = getUserRoleForAccessingConvention(convention, user);

      if (!role)
        throw new ForbiddenError(
          `User with id '${authPayload.userId}' is not allowed to access convention with id '${conventionId}'`,
        );
    }

    return convention;
  }

  private isInclusionConnectPayload(
    authPayload: ConventionJwtPayload | undefined,
    conventionId: ConventionId,
  ): authPayload is InclusionConnectJwtPayload {
    if (!authPayload) throw new ForbiddenError(`No auth payload provided`);
    if (!("role" in authPayload)) return true;
    if (authPayload.role === "backOffice") return false;
    if (authPayload.applicationId === conventionId) return false;
    throw new ForbiddenError(
      `This token is not allowed to access convention with id ${conventionId}. Role was '${authPayload.role}'`,
    );
  }
}
