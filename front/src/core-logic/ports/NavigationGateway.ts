import { AbsoluteUrl } from "shared";
import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";

export interface NavigationGateway {
  navigateToEstablishmentForm(
    formEstablishmentParamsInUrl: FormEstablishmentParamsInUrl,
  ): void;
  goToUrl(url: AbsoluteUrl): void;
}
