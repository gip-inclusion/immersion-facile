import { filter } from "ramda";
import {
  ApiConsumer,
  ConventionReadDto,
  WithConventionDto,
  isApiConsumerAllowed,
  pipeWithValue,
  withConventionSchema,
} from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { isConventionInScope } from "../../../convention/entities/Convention";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { getReferedAgency } from "../helpers/agency";
import { SubscribersGateway } from "../ports/SubscribersGateway";

const isConsumerSubscribedToConventionUpdated = (apiConsumer: ApiConsumer) => {
  const conventionUpdatedCallbackParams =
    apiConsumer.rights.convention.subscriptions.find(
      (sub) => sub.subscribedEvent === "convention.updated",
    );
  return !!conventionUpdatedCallbackParams;
};

export class BroadcastToPartnersOnConventionUpdates extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #subscribersGateway: SubscribersGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    subscribersGateway: SubscribersGateway,
  ) {
    super(uowPerformer);
    this.#subscribersGateway = subscribersGateway;
  }

  protected async _execute({ convention }: WithConventionDto, uow: UnitOfWork) {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new NotFoundError(
        `Agency with Id ${convention.agencyId} not found`,
      );
    }

    const conventionRead: ConventionReadDto = {
      ...convention,
      agencyName: agency.name,
      agencyDepartment: agency.address.departmentCode,
      agencyKind: agency.kind,
      agencySiret: agency.agencySiret,
      agencyRefersTo: agency.refersToAgencyId
        ? await getReferedAgency(uow, agency.refersToAgencyId)
        : undefined,
      agencyCounsellorEmails: agency.counsellorEmails,
      agencyValidatorEmails: agency.validatorEmails,
    };

    const apiConsumers = pipeWithValue(
      await uow.apiConsumerRepository.getAll(),
      filter<ApiConsumer>(
        (apiConsumer) =>
          isApiConsumerAllowed({
            apiConsumer,
            rightName: "convention",
            consumerKind: "SUBSCRIPTION",
          }) &&
          isConventionInScope(conventionRead, apiConsumer) &&
          isConsumerSubscribedToConventionUpdated(apiConsumer),
      ),
    );

    await Promise.all(
      apiConsumers.map((apiConsumers) => {
        const conventionUpdatedCallbackParams =
          apiConsumers.rights.convention.subscriptions.find(
            (sub) => sub.subscribedEvent === "convention.updated",
          );
        if (!conventionUpdatedCallbackParams) {
          throw new Error(
            `No callback params found for convention.updated : apiConsumer : ${apiConsumers.id} | convention : ${conventionRead.id}`,
          );
        }

        return this.#subscribersGateway.notify(
          {
            payload: {
              convention: conventionRead,
            },
            subscribedEvent: "convention.updated",
          },
          {
            callbackUrl: conventionUpdatedCallbackParams.callbackUrl,
            callbackHeaders: conventionUpdatedCallbackParams.callbackHeaders,
          },
        );
      }),
    );
  }
}
