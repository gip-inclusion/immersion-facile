import React from "react";
import { FederatedIdentity } from "shared";
import { SectionTitle } from "react-design-system";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
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
      <SectionTitle>
        {t.immersionConditionsSection.title}
        <ShareActions
          isFrozen={isFrozen}
          federatedIdentity={federatedIdentity}
        />
      </SectionTitle>
      <ImmersionConditionsCommonFields disabled={isFrozen} />
    </>
  );
};
