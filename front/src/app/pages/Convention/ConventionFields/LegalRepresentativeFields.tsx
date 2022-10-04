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
        label={`${t.beneficiaryRepresentative.firstNameLabel} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.firstName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiaryRepresentative.lastNameLabel} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.lastName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiaryRepresentative.email.label} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.email",
        )}
        type="email"
        placeholder={t.beneficiaryRepresentative.email.placeholder}
        description={t.beneficiaryRepresentative.email.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiaryRepresentative.phone.label} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.phone",
        )}
        type="tel"
        placeholder={t.beneficiaryRepresentative.phone.placeholder}
        description={t.beneficiaryRepresentative.phone.description}
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
    getConventionFieldName("signatories.beneficiaryRepresentative"),
  );
  const [, , { setValue: setRole }] = useField<Role>(
    getConventionFieldName("signatories.beneficiaryRepresentative.role"),
  );
  useEffect(() => {
    setRole("legal-representative2");
    return () => setLegalRepresentative(undefined);
  }, []);
};

const useLegalRepresentativeAsEmergencyContact = () => {
  const legalRepresentativeFirstName = useFieldValueString(
    "signatories.beneficiaryRepresentative.firstName",
  );
  const legalRepresentativeLastName = useFieldValueString(
    "signatories.beneficiaryRepresentative.lastName",
  );
  const legalRepresentativePhone = useFieldValueString(
    "signatories.beneficiaryRepresentative.phone",
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
