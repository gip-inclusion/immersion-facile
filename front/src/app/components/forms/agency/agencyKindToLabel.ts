import {
  AgencyKind,
  agencyKindList,
  agencyKindToLabel,
  AllowedAgencyKindToAdd,
} from "shared";

const allAgencyKindToLabel: Record<AgencyKind, string> = {
  ...agencyKindToLabel,
  "immersion-facile": "Immersion facilitée",
};

export const agencyListOfOptions = agencyKindList
  .filter(
    (agencyKind): agencyKind is AllowedAgencyKindToAdd =>
      agencyKind !== "immersion-facile",
  )
  .map((agencyKind) => ({
    value: agencyKind,
    label: agencyKindToLabel[agencyKind],
  }));

export const allAgencyListOfOptions = agencyKindList.map((agencyKind) => ({
  value: agencyKind,
  label: allAgencyKindToLabel[agencyKind],
}));
