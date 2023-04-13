import { z } from "zod";
import { AbsoluteUrl, frontRoutes, queryParamsAsString } from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { AccessTokenDto } from "../dto/AccessToken.dto";
import {
  ConventionPeConnectFields,
  PeUserAndAdvisor,
  toPartialConventionDtoWithPeIdentity,
} from "../dto/PeConnect.dto";
import { chooseValidAdvisor } from "../entities/ConventionPoleEmploiAdvisorEntity";
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
    return accessToken
      ? this.onAccessToken(accessToken, uow)
      : this.makeRedirectUrl({
          fedIdProvider: "peConnect",
          fedId: "AuthFailed",
        });
  }

  private async onAccessToken(accessToken: AccessTokenDto, uow: UnitOfWork) {
    const userAndAdvisors = await this.peConnectGateway.getUserAndAdvisors(
      accessToken,
    );
    if (!userAndAdvisors)
      return this.makeRedirectUrl({
        fedIdProvider: "peConnect",
        fedId: "AuthFailed",
      });
    const { user, advisors } = userAndAdvisors;

    const peUserAndAdvisor: PeUserAndAdvisor = {
      user,
      advisor: user.isJobseeker ? chooseValidAdvisor(advisors) : undefined,
    };

    if (peUserAndAdvisor.user.isJobseeker)
      await uow.conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        peUserAndAdvisor,
      );

    return this.makeRedirectUrl(toPartialConventionDtoWithPeIdentity(user));
  }

  private makeRedirectUrl(
    fields: Partial<ConventionPeConnectFields>,
  ): AbsoluteUrl {
    return `${this.baseUrlForRedirect}/${
      frontRoutes.conventionImmersionRoute
    }?${queryParamsAsString<Partial<ConventionPeConnectFields>>(fields)}`;
  }
}
