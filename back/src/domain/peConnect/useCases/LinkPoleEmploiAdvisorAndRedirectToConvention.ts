import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { frontRoutes } from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { z } from "../../../../node_modules/zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  ConventionPeConnectFields,
  ConventionPoleEmploiUserAdvisorEntity,
  toPartialConventionDto,
} from "../dto/PeConnect.dto";
import {
  conventionPoleEmploiAdvisorFromDto,
  poleEmploiUserAdvisorDTOFromUserAndAdvisors,
} from "../entities/ConventionPoleEmploiAdvisorEntity";
import { PeConnectGateway } from "../port/PeConnectGateway";

export class LinkPoleEmploiAdvisorAndRedirectToConvention extends TransactionalUseCase<
  string,
  AbsoluteUrl
> {
  inputSchema = z.string();

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private peConnectGateway: PeConnectGateway,
    private baseUrlForRedirect: AbsoluteUrl,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    authorizationCode: string,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const { user, advisors } = await this.peConnectGateway.getUserAndAdvisors(
      authorizationCode,
    );
    const poleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity =
      conventionPoleEmploiAdvisorFromDto(
        poleEmploiUserAdvisorDTOFromUserAndAdvisors({
          user,
          advisors,
        }),
      );

    await uow.conventionPoleEmploiAdvisorRepo.openSlotForNextConvention(
      poleEmploiUserAdvisorEntity,
    );

    const peQueryParams = queryParamsAsString<ConventionPeConnectFields>(
      toPartialConventionDto(user),
    );

    return `${this.baseUrlForRedirect}/${frontRoutes.immersionApplicationsRoute}?${peQueryParams}`;
  }
}
