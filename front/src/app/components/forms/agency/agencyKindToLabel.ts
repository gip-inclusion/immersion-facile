import type { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import {
  type AgencyKind,
  type AllowedAgencyKindToAdd,
  agencyKindList,
  agencyKindToLabel,
  allAgencyKindsAllowedToAdd,
} from "shared";

const allAgencyKindToLabel: Record<AgencyKind, string> = {
  ...agencyKindToLabel,
  "immersion-facile": "Immersion facilitée",
  "prepa-apprentissage": "Prépa Apprentissage",
};

export const agencyListOfOptions: SelectProps.Option<AllowedAgencyKindToAdd>[] =
  allAgencyKindsAllowedToAdd.map((agencyKind) => ({
    value: agencyKind,
    label: agencyKindToLabel[agencyKind],
  }));

export const allAgencyListOfOptions: SelectProps.Option<AgencyKind>[] =
  agencyKindList.map((agencyKind) => ({
    value: agencyKind,
    label: allAgencyKindToLabel[agencyKind],
  }));
