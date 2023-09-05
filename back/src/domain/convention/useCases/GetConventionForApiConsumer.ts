import {
  ApiConsumer,
  ConventionReadDto,
  WithConventionId,
  withConventionIdSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetConventionForApiConsumer extends TransactionalUseCase<
  WithConventionId,
  ConventionReadDto,
  ApiConsumer
> {
  protected inputSchema = withConventionIdSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    { conventionId }: WithConventionId,
    uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<ConventionReadDto> {
    if (!apiConsumer) throw new ForbiddenError("No api consumer provided");

    const convention = await uow.conventionQueries.getConventionById(
      conventionId,
    );
    if (!convention) throw noConventionFound(conventionId);

    if (isAgencyIdInConsumerScope(convention, apiConsumer)) return convention;
    if (await isAgencyKindInConsumerScope(convention, apiConsumer, uow))
      return convention;

    throw new ForbiddenError(
      `You are not allowed to access convention : ${conventionId}`,
    );
  }
}

const isAgencyIdInConsumerScope = (
  convention: ConventionReadDto,
  apiConsumer: ApiConsumer,
) => {
  const { scope } = apiConsumer.rights.convention;
  return scope.agencyIds && scope.agencyIds.includes(convention.agencyId);
};

const isAgencyKindInConsumerScope = async (
  convention: ConventionReadDto,
  apiConsumer: ApiConsumer,
  uow: UnitOfWork,
) => {
  const { scope } = apiConsumer.rights.convention;
  if (!scope.agencyKinds) return false;
  const agencies = await uow.agencyRepository.getByIds([convention.agencyId]);
  const agency = agencies.at(0);
  if (!agency) return false;
  return scope.agencyKinds.includes(agency.kind);
};

const noConventionFound = (conventionId: string) =>
  new NotFoundError(`No convention found with id ${conventionId}`);
