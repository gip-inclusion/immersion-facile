import React from "react";
import { FederatedIdentity } from "shared";
import { FormSectionTitle } from "src/app/components/FormSectionTitle";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { ImmersionConditionsCommonFields } from "./ImmersionConditionsCommonFields";
import { ShareActions } from "../../ShareActions";

type ImmersionConditionFormSectionProperties = {
  federatedIdentity: FederatedIdentity | undefined;
  isFrozen: boolean | undefined;
};

export const ImmersionConditionFormSection = ({
  federatedIdentity,
  isFrozen,
}: ImmersionConditionFormSectionProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <FormSectionTitle>
        {t.immersionConditionsSection.title}
        <ShareActions
          isFrozen={isFrozen}
          federatedIdentity={federatedIdentity}
        />
      </FormSectionTitle>
      <ImmersionConditionsCommonFields disabled={isFrozen} />
    </>
  );
};
