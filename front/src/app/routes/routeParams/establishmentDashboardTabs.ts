import {
  EstablishmentDashboardTab,
  establishmentDashboardTabsList,
} from "shared";
import { ValueSerializer } from "type-route";

export const icUserEstablishmentDashboardTabSerializer: ValueSerializer<EstablishmentDashboardTab> =
  {
    parse: (raw) => raw as EstablishmentDashboardTab,
    stringify: (tab) => tab,
  };

export const isEstablishmentDashboardTab = (
  input: string,
): input is EstablishmentDashboardTab =>
  establishmentDashboardTabsList.includes(input as EstablishmentDashboardTab);
