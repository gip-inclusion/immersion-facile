import { z } from "zod";
import {
  AbsoluteUrl,
  authFailed,
  frontRoutes,
  queryParamsAsString,
} from "shared";
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
  protected inputSchema = z.string();

  readonly #peConnectGateway: PeConnectGateway;

  readonly #baseUrlForRedirect: AbsoluteUrl;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    peConnectGateway: PeConnectGateway,
    baseUrlForRedirect: AbsoluteUrl,
  ) {
    super(uowPerformer);

    this.#baseUrlForRedirect = baseUrlForRedirect;
    this.#peConnectGateway = peConnectGateway;
  }

  protected async _execute(
    authorizationCode: string,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const accessToken = await this.#peConnectGateway.getAccessToken(
      authorizationCode,
    );
    return accessToken
      ? this.#onAccessToken(accessToken, uow)
      : this.#makeRedirectUrl({
          fedIdProvider: "peConnect",
          fedId: authFailed,
        });
  }

  #makeRedirectUrl(fields: Partial<ConventionPeConnectFields>): AbsoluteUrl {
    return `${this.#baseUrlForRedirect}/${
      frontRoutes.conventionImmersionRoute
    }?${queryParamsAsString<Partial<ConventionPeConnectFields>>(fields)}`;
  }

  async #onAccessToken(accessToken: AccessTokenDto, uow: UnitOfWork) {
    const userAndAdvisors = await this.#peConnectGateway.getUserAndAdvisors(
      accessToken,
    );
    if (!userAndAdvisors)
      return this.#makeRedirectUrl({
        fedIdProvider: "peConnect",
        fedId: authFailed,
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

    return this.#makeRedirectUrl(toPartialConventionDtoWithPeIdentity(user));
  }
}
