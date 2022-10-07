import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { getConventionFieldName } from "shared";
import { RadioGroup } from "src/app/components/RadioGroup";
import { BeneficiaryRepresentativeFields } from "src/app/pages/Convention/ConventionFields/BeneficiaryRepresentativeFields";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { TextInput } from "src/uiComponents/form/TextInput";

const useIsMinor = () => {
  const [isMinor, setIsMinor] = useState<boolean>(false);

  const [{ value: beneficiaryRepresentative }] = useField(
    getConventionFieldName("signatories.beneficiaryRepresentative"),
  );

  const isMinorFromData = !!beneficiaryRepresentative;

  useEffect(() => {
    if (isMinorFromData) setIsMinor(true);
  }, [isMinorFromData]);

  return { isMinor, setIsMinor };
};

export const BeneficiaryCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const { isMinor, setIsMinor } = useIsMinor();
  const t = useConventionTextsFromFormikContext();

  return (
    <>
      <TextInput
        label={`${t.beneficiary.firstNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.firstName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.lastNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.lastName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.email.label} *`}
        name={getConventionFieldName("signatories.beneficiary.email")}
        type="email"
        placeholder={t.beneficiary.email.placeholder}
        description={t.beneficiary.email.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.phone.label} *`}
        name={getConventionFieldName("signatories.beneficiary.phone")}
        type="tel"
        placeholder={t.beneficiary.phone.placeholder}
        description={t.beneficiary.phone.description}
        disabled={disabled}
      />
      <RadioGroup
        id="is-minor"
        disabled={disabled}
        currentValue={isMinor}
        setCurrentValue={() => setIsMinor(!isMinor)}
        groupLabel={`${t.beneficiary.isMinorLabel} *`}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />

      {isMinor ? (
        <BeneficiaryRepresentativeFields disabled={disabled} />
      ) : (
        <>
          <TextInput
            label={t.emergencyContact.nameLabel}
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContact",
            )}
            type="text"
            placeholder=""
            description=""
            disabled={disabled}
          />
          <TextInput
            label={t.emergencyContact.phone.label}
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContactPhone",
            )}
            type="tel"
            placeholder={t.emergencyContact.phone.placeholder}
            description=""
            disabled={disabled}
          />
        </>
      )}
    </>
  );
};
