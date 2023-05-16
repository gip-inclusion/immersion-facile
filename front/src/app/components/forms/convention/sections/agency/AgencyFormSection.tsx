import React from "react";
import { InternshipKind } from "shared";
import { AgencyDisplayReadOnly } from "./AgencyDisplayReadOnly";
import { AgencySelector } from "./AgencySelector";

type agencyFormSectionProperties = {
  agencyId: string;
  enablePeConnectApi: boolean;
  internshipKind: InternshipKind;
  isFrozen: boolean | undefined;
};

export const AgencyFormSection = ({
  internshipKind,
  agencyId,
  enablePeConnectApi,
  isFrozen,
}: agencyFormSectionProperties) => (
  <>
    {isFrozen ? (
      <AgencyDisplayReadOnly agencyId={agencyId} />
    ) : (
      <AgencySelector
        internshipKind={internshipKind}
        disabled={isFrozen}
        defaultAgencyId={agencyId}
        shouldListAll={!enablePeConnectApi}
      />
    )}
  </>
);
