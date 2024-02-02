import React, { ReactNode } from "react";
import { AgencyDto, AgencyStatus, keys } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { TextCell } from "./TextCell";

type AgencyField = keyof AgencyDto;
type FieldsToLabel = Partial<Record<AgencyField, string>>;

const agencyFieldToLabel: FieldsToLabel = {
  id: "ID",
  name: "Nom",
  kind: "Type d'agence",
  status: "Statut",
  address: "Adresse",
  counsellorEmails: "Emails des conseillers",
  validatorEmails: "Emails des validateurs",
  adminEmails: "Emails des administrateurs",
  questionnaireUrl: "URL du questionnaire",
  signature: "Signature",
  agencySiret: "Siret",
  codeSafir: "Code Safir",
  logoUrl: "Url du logo",
};

const formatAgencyStatus = (status: AgencyStatus) => {
  switch (status) {
    case "closed":
      return "❌ FERMÉE";
    case "rejected":
      return "🚫 REJETÉE";
    case "needsReview":
      return "📙 À VALIDER";
    case "active":
      return "✅  ACTIVE";
    case "from-api-PE":
      return "👩‍💼 API PE";
  }
};

export const AgencyDetails = () => {
  const agency: AgencyDto | null = useAppSelector(
    agencyAdminSelectors.agencyNeedingReview,
  );
  if (!agency) return null;
  const buildContent = (field: AgencyField): ReactNode => {
    const value = agency[field];
    if (field === "status") return formatAgencyStatus(agency.status);
    if (field === "agencySiret" && typeof value === "string") {
      const url = `https://lemarche.inclusion.beta.gouv.fr/prestataires/?q=${value}`;
      return (
        <a href={url} target="_blank" rel="noreferrer">
          {value}
        </a>
      );
    }
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  };

  return (
    <div>
      {keys(agencyFieldToLabel).map(
        (field) =>
          agency[field] && (
            <TextCell
              title={
                /* biome-ignore lint/style/noNonNullAssertion: temp fix */
                agencyFieldToLabel[field]!
              }
              contents={buildContent(field)}
              key={field}
            />
          ),
      )}
      {agency.logoUrl && <img src={agency.logoUrl} alt="logo" width="100px" />}
    </div>
  );
};
