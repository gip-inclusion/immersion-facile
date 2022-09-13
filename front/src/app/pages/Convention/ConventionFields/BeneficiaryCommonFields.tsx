import React from "react";
import { getConventionFieldName } from "shared/src/convention/convention";
import { TextInput } from "src/uiComponents/form/TextInput";

export const BeneficiaryCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => (
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
      label="Téléphone"
      name={getConventionFieldName("signatories.beneficiary.phone")}
      type="tel"
      placeholder="0606060607"
      description="pour qu’on puisse vous contacter à propos de l’immersion"
      disabled={disabled}
    />
    <TextInput
      label="Prénom et nom de la personne à prévenir en cas d'urgence"
      name={getConventionFieldName("signatories.beneficiary.emergencyContact")}
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
);
