import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { frontRoutes } from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { z } from "../../../../node_modules/zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  ConventionPoleEmploiAdvisorEntity,
  ConventionPoleEmploiUserAdvisorEntityOpen,
  PoleEmploiUserAdvisorDTO,
} from "../entities/ConventionPoleEmploiAdvisorEntity";
import {
  ImmersionApplicationPeConnectFields,
  PeConnectGateway,
  peConnectUserInfoToImmersionApplicationDto,
} from "../port/PeConnectGateway";

export type LinkPoleEmploiAdvisorAndRedirectToConventionDepedencies = {
  uowPerformer: UnitOfWorkPerformer;
  uuidGenerator: UuidGenerator;
  peConnectGateway: PeConnectGateway;
  baseUrlForRedirect: AbsoluteUrl;
};

export class LinkPoleEmploiAdvisorAndRedirectToConvention extends TransactionalUseCase<
  string,
  AbsoluteUrl
> {
  inputSchema = z.string();

  private readonly uuidGenerator: UuidGenerator;
  private readonly peConnectGateway: PeConnectGateway;
  private readonly baseUrlForRedirect: AbsoluteUrl;

  constructor(
    dependencies: LinkPoleEmploiAdvisorAndRedirectToConventionDepedencies,
  ) {
    super(dependencies.uowPerformer);
    this.uuidGenerator = dependencies.uuidGenerator;
    this.peConnectGateway = dependencies.peConnectGateway;
    this.baseUrlForRedirect = dependencies.baseUrlForRedirect;
  }

  protected async _execute(
    authorizationCode: string,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const { user, advisors } = await this.peConnectGateway.getUserAndAdvisors(
      authorizationCode,
    );
    const poleEmploiUserAdvisor: PoleEmploiUserAdvisorDTO =
      ConventionPoleEmploiAdvisorEntity.createFromUserAndAdvisors({
        user,
        advisors,
      });

    await uow.conventionPoleEmploiAdvisorRepo.openSlotForNextConvention(
      toOpenedEntity(this.uuidGenerator, poleEmploiUserAdvisor),
    );

    const peQueryParams =
      queryParamsAsString<ImmersionApplicationPeConnectFields>(
        peConnectUserInfoToImmersionApplicationDto(user),
      );

    return `${this.baseUrlForRedirect}/${frontRoutes.immersionApplicationsRoute}?${peQueryParams}`;
  }
}

const toOpenedEntity = (
  uuidGenerator: UuidGenerator,
  poleEmploiUserAdvisor: PoleEmploiUserAdvisorDTO,
): ConventionPoleEmploiUserAdvisorEntityOpen => ({
  ...poleEmploiUserAdvisor,
  id: uuidGenerator.new(),
});
