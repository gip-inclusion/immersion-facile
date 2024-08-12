import { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import {
  AgencyKind,
  AllowedAgencyKindToAdd,
  agencyKindList,
  agencyKindToLabel,
  allAgencyKindsAllowedToAdd,
} from "shared";

const allAgencyKindToLabel: Record<AgencyKind, string> = {
  ...agencyKindToLabel,
  "immersion-facile": "Immersion facilitée",
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
