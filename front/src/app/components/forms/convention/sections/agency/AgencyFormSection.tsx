import React from "react";
import { InternshipKind } from "shared";
import { SectionTitle } from "react-design-system";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
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
}: agencyFormSectionProperties) => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <SectionTitle>{t.agencySection.title}</SectionTitle>
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
};
