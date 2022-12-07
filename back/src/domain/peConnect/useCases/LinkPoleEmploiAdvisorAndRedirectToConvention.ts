import { AbsoluteUrl, frontRoutes, queryParamsAsString } from "shared";
import { z } from "zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  ConventionPeConnectFields,
  ConventionPoleEmploiUserAdvisorEntity,
  PeUserAndAdvisor,
  toPartialConventionDtoWithPeIdentity,
} from "../dto/PeConnect.dto";
import {
  chooseValidAdvisor,
  conventionPoleEmploiUserAdvisorFromDto,
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
    const accessToken = await this.peConnectGateway.getAccessToken(
      authorizationCode,
    );

    if (!accessToken) return this.authFailedRedirectUrl();

    const { user, advisors } = await this.peConnectGateway.getUserAndAdvisors(
      accessToken,
    );

    const fromGateway: PeUserAndAdvisor = {
      user,
      advisor: user.isJobseeker ? chooseValidAdvisor(advisors) : undefined,
    };

    const poleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity =
      conventionPoleEmploiUserAdvisorFromDto(fromGateway);

    await uow.conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
      poleEmploiUserAdvisorEntity,
    );

    const peQueryParams = queryParamsAsString<ConventionPeConnectFields>(
      toPartialConventionDtoWithPeIdentity(user),
    );

    return `${this.baseUrlForRedirect}/${frontRoutes.conventionImmersionRoute}?${peQueryParams}`;
  }

  private authFailedRedirectUrl(): AbsoluteUrl {
    return `${this.baseUrlForRedirect}/${frontRoutes.conventionImmersionRoute}?federatedIdentity=peConnect:AuthFailed`;
  }
}
