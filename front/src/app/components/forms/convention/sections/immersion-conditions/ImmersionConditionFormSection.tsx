import React from "react";
import { useFormContext } from "react-hook-form";
import { ConventionReadDto, FederatedIdentity } from "shared";
import { SectionTitle } from "react-design-system";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { ShareActions } from "../../ShareActions";
import { ImmersionConditionsCommonFields } from "./ImmersionConditionsCommonFields";

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
