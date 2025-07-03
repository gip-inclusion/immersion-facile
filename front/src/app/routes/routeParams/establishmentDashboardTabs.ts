import {
  type EstablishmentDashboardTab,
  establishmentDashboardTabsList,
} from "shared";
import type { ValueSerializer } from "type-route";

export const userEstablishmentDashboardTabSerializer: ValueSerializer<EstablishmentDashboardTab> =
  {
    parse: (raw) => raw as EstablishmentDashboardTab,
    stringify: (tab) => tab,
  };

export const isEstablishmentDashboardTab = (
  input: string,
): input is EstablishmentDashboardTab =>
  establishmentDashboardTabsList.includes(input as EstablishmentDashboardTab);
