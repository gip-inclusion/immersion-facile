import React, { ReactNode } from "react";
import { keys } from "shared";
import { AgencyDto, AgencyStatus } from "shared";
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
};

const formatAgencyStatus = (status: AgencyStatus) => {
  switch (status) {
    case "closed":
      return "❌ FERMÉE";
    case "needsReview":
      return "📙 À VALIDER";
    case "active":
      return "✅  ACTIVE";
    case "from-api-PE":
      return "👩‍💼 API PE";
  }
  return "⁉️ STATUT INDÉFINI";
};

export const AgencyDetails = ({ agency }: { agency: AgencyDto }) => {
  const buildContent = (field: AgencyField): ReactNode => {
    const value = agency[field];
    if (field === "status") return formatAgencyStatus(agency.status);
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return value ? "✅" : "❌";
    return JSON.stringify(value);
  };

  return (
    <div>
      {keys(agencyFieldToLabel).map(
        (field) =>
          agency[field] && (
            <TextCell
              title={
                /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                agencyFieldToLabel[field]!
              }
              contents={buildContent(field)}
              key={field}
            />
          ),
      )}
    </div>
  );
};
