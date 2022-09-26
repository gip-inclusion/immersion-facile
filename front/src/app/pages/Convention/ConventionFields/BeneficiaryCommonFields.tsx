import { useField } from "formik";
import React, { useState, useEffect } from "react";
import { getConventionFieldName } from "shared/src/convention/convention";
import { RadioGroup } from "src/app/components/RadioGroup";
import { LegalRepresentativeFields } from "src/app/pages/Convention/ConventionFields/LegalRepresentativeFields";
import { TextInput } from "src/uiComponents/form/TextInput";

const useIsMinor = () => {
  const [isMinor, setIsMinor] = useState<boolean>(false);

  const [{ value: legalRepresentative }] = useField(
    getConventionFieldName("signatories.legalRepresentative"),
  );

  const isMinorFromData = !!legalRepresentative;

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

  return (
    <>
      <TextInput
        label="Prénom *"
        name={getConventionFieldName("signatories.beneficiary.firstName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label="Nom de famille *"
        name={getConventionFieldName("signatories.beneficiary.lastName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label="E-mail *"
        name={getConventionFieldName("signatories.beneficiary.email")}
        type="email"
        placeholder="nom@exemple.com"
        description="cela nous permet de vous transmettre la validation de la convention"
        disabled={disabled}
      />
      <TextInput
        label="Téléphone *"
        name={getConventionFieldName("signatories.beneficiary.phone")}
        type="tel"
        placeholder="0606060607"
        description="pour qu’on puisse vous contacter à propos de l’immersion"
        disabled={disabled}
      />
      <RadioGroup
        id="is-minor"
        disabled={disabled}
        currentValue={isMinor}
        setCurrentValue={() => setIsMinor(!isMinor)}
        groupLabel="La personne qui va faire l'immersion est-elle mineure ? *"
        options={[
          { label: "Oui", value: true },
          { label: "Non", value: false },
        ]}
      />

      {isMinor ? (
        <LegalRepresentativeFields disabled={disabled} />
      ) : (
        <>
          <TextInput
            label="Prénom et nom de la personne à prévenir en cas d'urgence"
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContact",
            )}
            type="text"
            placeholder=""
            description=""
            disabled={disabled}
          />
          <TextInput
            label="Téléphone de la personne à prévenir en cas d'urgence"
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContactPhone",
            )}
            type="tel"
            placeholder="0606060607"
            description=""
            disabled={disabled}
          />
        </>
      )}
    </>
  );
};
