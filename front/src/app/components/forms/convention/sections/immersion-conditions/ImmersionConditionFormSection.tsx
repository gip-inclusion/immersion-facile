import React from "react";
import { ConventionReadDto, FederatedIdentity } from "shared";
import { SectionTitle } from "react-design-system";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { ImmersionConditionsCommonFields } from "./ImmersionConditionsCommonFields";
import { ShareActions } from "../../ShareActions";
import { useFormContext } from "react-hook-form";

type ImmersionConditionFormSectionProperties = {
  federatedIdentity: FederatedIdentity | undefined;
  isFrozen: boolean | undefined;
};

export const ImmersionConditionFormSection = ({
  federatedIdentity,
  isFrozen,
}: ImmersionConditionFormSectionProperties): JSX.Element => {
  const { getValues } = useFormContext<ConventionReadDto>();
  const t = useConventionTexts(getValues().internshipKind);
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
