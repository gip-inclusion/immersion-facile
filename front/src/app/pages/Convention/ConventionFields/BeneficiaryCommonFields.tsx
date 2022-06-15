import React from "react";
import { TextInput } from "src/uiComponents/form/TextInput";

export const BeneficiaryCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => (
  <>
    <TextInput
      label="Email *"
      name="email"
      type="email"
      placeholder="nom@exemple.com"
      description="cela nous permet de vous transmettre la validation de la convention"
      disabled={disabled}
    />
    <TextInput
      label="Votre prénom *"
      name="firstName"
      type="text"
      placeholder=""
      description=""
      disabled={disabled}
    />
    <TextInput
      label="Votre nom *"
      name="lastName"
      type="text"
      placeholder=""
      description=""
      disabled={disabled}
    />
    <TextInput
      label="Votre numéro de téléphone"
      name="phone"
      type="tel"
      placeholder="0606060607"
      description="pour qu’on puisse vous contacter à propos de l’immersion"
      disabled={disabled}
    />
    <TextInput
      label="Indiquez le prénom et le nom de la personne à prévenir en cas d'urgence"
      name="emergencyContact"
      type="text"
      placeholder=""
      description=""
      disabled={disabled}
    />
    <TextInput
      label="Indiquez le numéro de téléphone de la personne à prévenir en cas d'urgence"
      name="emergencyContactPhone"
      type="tel"
      placeholder="0606060607"
      description=""
      disabled={disabled}
    />
  </>
);
