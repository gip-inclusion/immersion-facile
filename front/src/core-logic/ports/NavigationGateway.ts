import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";

export interface NavigationGateway {
  navigateToEstablishmentForm(
    formEstablishmentParamsInUrl: FormEstablishmentParamsInUrl,
  ): void;
}
