import { useField } from "formik";
import React, { useEffect } from "react";
import { ConventionField, getConventionFieldName, Role } from "shared";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { TextInput } from "src/uiComponents/form/TextInput";

type LegalRepresentativeFieldsProps = { disabled?: boolean };

export const LegalRepresentativeFields = ({
  disabled,
}: LegalRepresentativeFieldsProps) => {
  useLegalRepresentativeAsEmergencyContact();
  useLegalRepresentativeRole();
  const t = useConventionTextsFromFormikContext();

  return (
    <div>
      <TextInput
        label={`${t.legalRepresentative.lastNameLabel} *`}
        name={getConventionFieldName(
          "signatories.legalRepresentative.firstName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.legalRepresentative.lastNameLabel} *`}
        name={getConventionFieldName(
          "signatories.legalRepresentative.lastName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.legalRepresentative.email.label} *`}
        name={getConventionFieldName("signatories.legalRepresentative.email")}
        type="email"
        placeholder={t.legalRepresentative.email.placeholder}
        description={t.legalRepresentative.email.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.legalRepresentative.phone.label} *`}
        name={getConventionFieldName("signatories.legalRepresentative.phone")}
        type="tel"
        placeholder={t.legalRepresentative.phone.placeholder}
        description={t.legalRepresentative.phone.description}
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
