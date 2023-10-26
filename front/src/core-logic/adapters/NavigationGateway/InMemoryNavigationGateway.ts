import { AbsoluteUrl } from "shared";
import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class InMemoryNavigationGateway implements NavigationGateway {
  // test purpose
  public navigatedToEstablishmentForm: FormEstablishmentParamsInUrl | null =
    null;

  #wentToUrls: AbsoluteUrl[] = [];

  public goToUrl(url: AbsoluteUrl) {
    this.#wentToUrls.push(url);
  }

  public navigateToEstablishmentForm(
    formEstablishment: FormEstablishmentParamsInUrl,
  ): void {
    this.navigatedToEstablishmentForm = formEstablishment;
  }

  public get wentToUrls(): AbsoluteUrl[] {
    return this.#wentToUrls;
  }
}
