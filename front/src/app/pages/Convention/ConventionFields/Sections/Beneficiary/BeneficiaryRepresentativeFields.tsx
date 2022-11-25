import { useField, useFormikContext } from "formik";
import React, { useEffect } from "react";
import {
  ConventionDto,
  ConventionField,
  getConventionFieldName,
  Role,
} from "shared";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { TextInput } from "src/uiComponents/form/TextInput";
import { ConventionEmailWarning } from "../../../ConventionEmailWarning";

type BeneficiaryRepresentativeFieldsProps = { disabled?: boolean };

export const BeneficiaryRepresentativeFields = ({
  disabled,
}: BeneficiaryRepresentativeFieldsProps) => {
  useBeneficiaryRepresentativeAsEmergencyContact();
  useBeneficiaryRepresentativeRole();
  const t = useConventionTextsFromFormikContext();
  const { values } = useFormikContext<ConventionDto>();

  return (
    <>
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
      {values.signatories.beneficiaryRepresentative?.email && (
        <ConventionEmailWarning />
      )}
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
    </>
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

const useBeneficiaryRepresentativeRole = () => {
  const [, , { setValue: setBeneficiaryRepresentative }] = useField(
    getConventionFieldName("signatories.beneficiaryRepresentative"),
  );
  const [, , { setValue: setRole }] = useField<Role>(
    getConventionFieldName("signatories.beneficiaryRepresentative.role"),
  );
  useEffect(() => {
    setRole("beneficiary-representative");
    return () => setBeneficiaryRepresentative(undefined);
  }, []);
};

const useBeneficiaryRepresentativeAsEmergencyContact = () => {
  const beneficiaryRepresentativeFirstName = useFieldValueString(
    "signatories.beneficiaryRepresentative.firstName",
  );
  const beneficiaryRepresentativeLastName = useFieldValueString(
    "signatories.beneficiaryRepresentative.lastName",
  );
  const beneficiaryRepresentativePhone = useFieldValueString(
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
      [beneficiaryRepresentativeFirstName, beneficiaryRepresentativeLastName]
        .filter((v) => !!v)
        .join(" ") || undefined,
    );
  }, [beneficiaryRepresentativeFirstName, beneficiaryRepresentativeLastName]);

  useEffect(() => {
    setEmergencyContactPhone(beneficiaryRepresentativePhone);
  }, [beneficiaryRepresentativePhone]);
};
