import type { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import {
  type AgencyKind,
  type AllowedAgencyKindToAdd,
  agencyKindToLabel,
  allAgencyKindsAllowedToAdd,
  orderedAgencyKindList,
} from "shared";

const allAgencyKindToLabel: Record<AgencyKind, string> = {
  ...agencyKindToLabel,
  "immersion-facile": "Immersion facilitée",
  "prepa-apprentissage": "Prépa Apprentissage",
};

export const agencyKindListOfOptions: SelectProps.Option<AllowedAgencyKindToAdd>[] =
  allAgencyKindsAllowedToAdd.map((agencyKind) => ({
    value: agencyKind,
    label: agencyKindToLabel[agencyKind],
  }));

export const allAgencyKindListOfOptions: SelectProps.Option<AgencyKind>[] =
  orderedAgencyKindList.map((agencyKind) => ({
    value: agencyKind,
    label: allAgencyKindToLabel[agencyKind],
  }));
