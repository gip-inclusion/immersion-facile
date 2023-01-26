import { useField, useFormikContext } from "formik";
import React, { useEffect } from "react";
import {
  ConventionDto,
  ConventionField,
  getConventionFieldName,
  Role,
} from "shared";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";

type BeneficiaryRepresentativeFieldsProps = { disabled?: boolean };

export const BeneficiaryRepresentativeFields = ({
  disabled,
}: BeneficiaryRepresentativeFieldsProps) => {
  useBeneficiaryRepresentativeAsEmergencyContact();
  useBeneficiaryRepresentativeRole();
  const { values } = useFormikContext<ConventionDto>();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <TextInput
        {...formContents["signatories.beneficiaryRepresentative.firstName"]}
        type="text"
        disabled={disabled}
      />
      <TextInput
        {...formContents["signatories.beneficiaryRepresentative.lastName"]}
        type="text"
        disabled={disabled}
      />
      <TextInput
        {...formContents["signatories.beneficiaryRepresentative.email"]}
        type="email"
        disabled={disabled}
      />
      {values.signatories.beneficiaryRepresentative?.email && (
        <ConventionEmailWarning />
      )}
      <TextInput
        {...formContents["signatories.beneficiaryRepresentative.phone"]}
        type="tel"
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
