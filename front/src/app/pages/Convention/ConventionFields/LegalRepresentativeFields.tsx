import { useField } from "formik";
import React, { useEffect } from "react";
import {
  ConventionField,
  getConventionFieldName,
} from "shared/src/convention/convention";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { TextInput } from "src/uiComponents/form/TextInput";

type LegalRepresentativeFieldsProps = { disabled?: boolean };

export const LegalRepresentativeFields = ({
  disabled,
}: LegalRepresentativeFieldsProps) => {
  useLegalRepresentativeAsEmergencyContact();
  useLegalRepresentativeRole();

  return (
    <div>
      <TextInput
        label="Prénom du représentant légal *"
        name={getConventionFieldName(
          "signatories.legalRepresentative.firstName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label="Nom de famille du représentant légal *"
        name={getConventionFieldName(
          "signatories.legalRepresentative.lastName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label="E-mail *"
        name={getConventionFieldName("signatories.legalRepresentative.email")}
        type="email"
        placeholder="nom@exemple.com"
        description="cela nous permet de vous transmettre la validation de la convention"
        disabled={disabled}
      />
      <TextInput
        label="Téléphone *"
        name={getConventionFieldName("signatories.legalRepresentative.phone")}
        type="tel"
        placeholder="0606060607"
        description="pour qu’on puisse vous contacter à propos de l’immersion"
        disabled={disabled}
      />
    </div>
  );
};

const useFieldValueString = (fieldName: ConventionField) => {
  const [{ value }] = useField<string | undefined>(
    getConventionFieldName(fieldName),
  );
  return value;
};

const useFieldValueStringSetter = (fieldName: ConventionField) => {
  const [, , { setValue }] = useField<string | undefined>(
    getConventionFieldName(fieldName),
  );
  return setValue;
};

const useLegalRepresentativeRole = () => {
  const [, , { setValue: setLegalRepresentative }] = useField(
    getConventionFieldName("signatories.legalRepresentative"),
  );
  const [, , { setValue: setRole }] = useField<Role>(
    getConventionFieldName("signatories.legalRepresentative.role"),
  );
  useEffect(() => {
    setRole("legal-representative");
    return () => setLegalRepresentative(undefined);
  }, []);
};

const useLegalRepresentativeAsEmergencyContact = () => {
  const legalRepresentativeFirstName = useFieldValueString(
    "signatories.legalRepresentative.firstName",
  );
  const legalRepresentativeLastName = useFieldValueString(
    "signatories.legalRepresentative.lastName",
  );
  const legalRepresentativePhone = useFieldValueString(
    "signatories.legalRepresentative.phone",
  );

  const setEmergencyContact = useFieldValueStringSetter(
    "signatories.beneficiary.emergencyContact",
  );
  const setEmergencyContactPhone = useFieldValueStringSetter(
    "signatories.beneficiary.emergencyContactPhone",
  );

  useEffect(() => {
    setEmergencyContact(
      [legalRepresentativeFirstName, legalRepresentativeLastName]
        .filter((v) => !!v)
        .join(" ") || undefined,
    );
  }, [legalRepresentativeFirstName, legalRepresentativeLastName]);

  useEffect(() => {
    setEmergencyContactPhone(legalRepresentativePhone);
  }, [legalRepresentativePhone]);
};
