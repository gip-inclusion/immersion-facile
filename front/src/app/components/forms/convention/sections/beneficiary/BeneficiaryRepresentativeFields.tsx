import { useField, useFormikContext } from "formik";
import React, { useEffect } from "react";
import {
  ConventionDto,
  ConventionField,
  getConventionFieldName,
  Role,
} from "shared";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";

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
        label={`${t.beneficiarySection.beneficiaryRepresentative.firstNameLabel} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.firstName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiarySection.beneficiaryRepresentative.lastNameLabel} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.lastName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiarySection.beneficiaryRepresentative.email.label} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.email",
        )}
        type="email"
        placeholder={
          t.beneficiarySection.beneficiaryRepresentative.email.placeholder
        }
        description={
          t.beneficiarySection.beneficiaryRepresentative.email.description
        }
        disabled={disabled}
      />
      {values.signatories.beneficiaryRepresentative?.email && (
        <ConventionEmailWarning />
      )}
      <TextInput
        label={`${t.beneficiarySection.beneficiaryRepresentative.phone.label} *`}
        name={getConventionFieldName(
          "signatories.beneficiaryRepresentative.phone",
        )}
        type="tel"
        placeholder={
          t.beneficiarySection.beneficiaryRepresentative.phone.placeholder
        }
        description={
          t.beneficiarySection.beneficiaryRepresentative.phone.description
        }
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
