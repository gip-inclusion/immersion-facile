import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { frontRoutes } from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { z } from "../../../../node_modules/zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionPoleEmploiAdvisorEntity } from "../entities/ConventionPoleEmploiAdvisorEntity";
import {
  ConventionPeConnectFields,
  toPartialConventionDto,
  PoleEmploiUserAdvisorDTO,
} from "../dto/PeConnect.dto";
import { PeConnectGateway } from "../port/PeConnectGateway";

export type LinkPoleEmploiAdvisorAndRedirectToConventionDepedencies = {
  uowPerformer: UnitOfWorkPerformer;
  peConnectGateway: PeConnectGateway;
  baseUrlForRedirect: AbsoluteUrl;
};

export class LinkPoleEmploiAdvisorAndRedirectToConvention extends TransactionalUseCase<
  string,
  AbsoluteUrl
> {
  inputSchema = z.string();

  private readonly peConnectGateway: PeConnectGateway;
  private readonly baseUrlForRedirect: AbsoluteUrl;

  constructor(
    dependencies: LinkPoleEmploiAdvisorAndRedirectToConventionDepedencies,
  ) {
    super(dependencies.uowPerformer);
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
      poleEmploiUserAdvisor,
    );

    const peQueryParams = queryParamsAsString<ConventionPeConnectFields>(
      toPartialConventionDto(user),
    );

    return `${this.baseUrlForRedirect}/${frontRoutes.immersionApplicationsRoute}?${peQueryParams}`;
  }
}
