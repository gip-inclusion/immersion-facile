import React from "react";
import { InternshipKind } from "shared";
import { AgencySelector } from "./AgencySelector";

type agencyFormSectionProperties = {
  agencyId: string;
  enablePeConnectApi: boolean;
  internshipKind: InternshipKind;
};

export const AgencyFormSection = ({
  internshipKind,
  agencyId,
  enablePeConnectApi,
}: agencyFormSectionProperties) => (
  <AgencySelector
    internshipKind={internshipKind}
    defaultAgencyId={agencyId}
    shouldListAll={!enablePeConnectApi}
  />
);
