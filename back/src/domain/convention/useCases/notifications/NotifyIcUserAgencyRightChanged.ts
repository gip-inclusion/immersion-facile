import {
  IcUserRoleForAgencyParams,
  icUserRoleForAgencyParamsSchema,
} from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyIcUserAgencyRightChanged extends TransactionalUseCase<
  IcUserRoleForAgencyParams,
  void
> {
  inputSchema = icUserRoleForAgencyParamsSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: IcUserRoleForAgencyParams,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([params.agencyId]);
    if (!agency) {
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${params.agencyId}`,
      );
    }

    const user = await uow.inclusionConnectedUserRepository.getById(
      params.userId,
    );
    if (!user)
      throw new NotFoundError(`User with id ${params.userId} not found`);

    if (params.role !== "toReview")
      await this.emailGateway.sendEmail({
        type: "IC_USER_RIGHTS_HAS_CHANGED",
        recipients: [user.email],
        params: {
          agencyName: agency.name,
        },
      });
  }
}
