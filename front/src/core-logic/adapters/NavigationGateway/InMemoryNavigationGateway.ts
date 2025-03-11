import type { AbsoluteUrl } from "shared";
import type { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import type { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class InMemoryNavigationGateway implements NavigationGateway {
  // test purpose
  public navigatedToEstablishmentForm: FormEstablishmentParamsInUrl | null =
    null;

  #wentToUrls: AbsoluteUrl[] = [];

  public goToUrl(url: AbsoluteUrl) {
    this.#wentToUrls.push(url);
  }

  public navigateToEstablishmentForm(
    formEstablishmentParams: FormEstablishmentParamsInUrl,
  ): void {
    this.navigatedToEstablishmentForm = formEstablishmentParams;
  }

  public get wentToUrls(): AbsoluteUrl[] {
    return this.#wentToUrls;
  }
}
