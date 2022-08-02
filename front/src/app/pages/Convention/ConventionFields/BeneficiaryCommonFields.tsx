import React from "react";
import { TextInput } from "src/uiComponents/form/TextInput";

export const BeneficiaryCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => (
  <>
    <TextInput
      label="Prénom *"
      name="firstName"
      type="text"
      placeholder=""
      description=""
      disabled={disabled}
    />
    <TextInput
      label="Nom de famille *"
      name="lastName"
      type="text"
      placeholder=""
      description=""
      disabled={disabled}
    />
    <TextInput
      label="E-mail *"
      name="email"
      type="email"
      placeholder="nom@exemple.com"
      description="cela nous permet de vous transmettre la validation de la convention"
      disabled={disabled}
    />
    <TextInput
      label="Téléphone"
      name="phone"
      type="tel"
      placeholder="0606060607"
      description="pour qu’on puisse vous contacter à propos de l’immersion"
      disabled={disabled}
    />
    <TextInput
      label="Prénom et nom de la personne à prévenir en cas d'urgence"
      name="emergencyContact"
      type="text"
      placeholder=""
      description=""
      disabled={disabled}
    />
    <TextInput
      label="Téléphone de la personne à prévenir en cas d'urgence"
      name="emergencyContactPhone"
      type="tel"
      placeholder="0606060607"
      description=""
      disabled={disabled}
    />
  </>
);
