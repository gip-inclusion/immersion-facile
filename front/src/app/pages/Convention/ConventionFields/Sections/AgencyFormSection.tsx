import React from "react";
import { AgencyDisplay } from "src/app/components/agency/AgencyDisplay";
import { AgencySelector } from "src/app/components/agency/AgencySelector";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";
import { useConventionTextsFromFormikContext } from "../../texts/textSetup";

type agencyFormSectionProperties = {
  agencyId: string;
  enablePeConnectApi: boolean;
  isFrozen: boolean | undefined;
};

export const AgencyFormSection = ({
  agencyId,
  enablePeConnectApi,
  isFrozen,
}: agencyFormSectionProperties) => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <FormSectionTitle>{t.forStartWeNeed}</FormSectionTitle>
      {isFrozen ? (
        <AgencyDisplay label={`${t.yourAgencyLabel} *`} agencyId={agencyId} />
      ) : (
        <AgencySelector
          label={`${t.yourAgencyLabel} *`}
          disabled={isFrozen}
          defaultAgencyId={agencyId}
          shouldListAll={!enablePeConnectApi}
        />
      )}
    </>
  );
};
