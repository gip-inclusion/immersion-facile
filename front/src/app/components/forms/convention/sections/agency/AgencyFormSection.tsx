import React from "react";
import { useFormContext } from "react-hook-form";
import { ConventionReadDto, InternshipKind } from "shared";
import { SectionTitle } from "react-design-system";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
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
  const { getValues } = useFormContext<ConventionReadDto>();
  const t = useConventionTexts(getValues().internshipKind);
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
