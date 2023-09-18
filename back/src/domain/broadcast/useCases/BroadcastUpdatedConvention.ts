import { filter } from "ramda";
import {
  ApiConsumer,
  ConventionDto,
  conventionSchema,
  isApiConsumerAllowed,
  pipeWithValue,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SubscribersGateway } from "../ports/SubscribersGateway";

export class BroadcastUpdatedConvention extends TransactionalUseCase<
  ConventionDto,
  void
> {
  protected inputSchema = conventionSchema;

  readonly #subscribersGateway: SubscribersGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    subscribersGateway: SubscribersGateway,
  ) {
    super(uowPerformer);
    this.#subscribersGateway = subscribersGateway;
  }

  protected async _execute(convention: ConventionDto, uow: UnitOfWork) {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new NotFoundError(
        `Agency with Id ${convention.agencyId} not found`,
      );
    }

    const apiConsumers = pipeWithValue(
      await uow.apiConsumerRepository.getAll(),
      filter<ApiConsumer>((apiConsumer) =>
        isApiConsumerAllowed({
          apiConsumer,
          rightName: "convention",
          consumerKind: "SUBSCRIPTION",
        }
      ),
    );

    apiConsumers.forEach((apiConsumers) => {
      await this.#subscribersGateway.notifyConventionUpdated({
        conventionRead: {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
        },
        callbackUrl: apiConsumers.subscriptions["convention.updated"],
        callbackHeaders: { authorization: "yo" },
      });
    });
  }
}
