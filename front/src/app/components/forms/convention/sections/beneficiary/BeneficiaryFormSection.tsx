import { useFormikContext } from "formik";
import React from "react";
import { useDispatch } from "react-redux";
import { ConventionDto } from "shared";
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { DateInput } from "src/app/components/forms/commons/DateInput";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { FormSectionTitle } from "src/app/components/forms/commons/FormSectionTitle";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
import { BeneficiaryCurrentEmployerFields } from "./BeneficiaryCurrentEmployerFields";
import { BeneficiaryEmergencyContactFields } from "./BeneficiaryEmergencyContactFields";
import { BeneficiaryRepresentativeFields } from "./BeneficiaryRepresentativeFields";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";

type beneficiaryFormSectionProperties = {
  isFrozen: boolean | undefined;
};
export const BeneficiaryFormSection = ({
  isFrozen,
}: beneficiaryFormSectionProperties): JSX.Element => {
  const isMinor = useAppSelector(conventionSelectors.isMinor);
  const hasCurrentEmployer = useAppSelector(
    conventionSelectors.hasCurrentEmployer,
  );
  const { setFieldValue } = useFormikContext<ConventionDto>();
  const dispatch = useDispatch();
  const t = useConventionTextsFromFormikContext();
  const { values } = useFormikContext<ConventionDto>();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <FormSectionTitle>{t.beneficiarySection.title}</FormSectionTitle>
      <TextInput
        {...formContents["signatories.beneficiary.firstName"]}
        type="text"
        disabled={isFrozen}
      />
      <TextInput
        {...formContents["signatories.beneficiary.lastName"]}
        type="text"
        disabled={isFrozen}
      />
      <DateInput
        {...formContents["signatories.beneficiary.birthdate"]}
        disabled={isFrozen}
        onDateChange={(date) => {
          setFieldValue(
            "signatories.beneficiary.birthdate",
            new Date(date).toISOString(),
          );
        }}
      />
      <TextInput
        {...formContents["signatories.beneficiary.email"]}
        type="email"
        disabled={isFrozen}
      />
      {values.signatories.beneficiary.email && <ConventionEmailWarning />}
      <TextInput
        {...formContents["signatories.beneficiary.phone"]}
        type="tel"
        disabled={isFrozen}
      />
      <RadioGroup
        {...formContents.isMinor}
        disabled={isFrozen}
        currentValue={isMinor}
        setCurrentValue={(value) =>
          dispatch(conventionSlice.actions.isMinorChanged(value))
        }
        groupLabel={formContents.isMinor.label}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />
      {isMinor ? (
        <BeneficiaryRepresentativeFields disabled={isFrozen} />
      ) : (
        <BeneficiaryEmergencyContactFields disabled={isFrozen} />
      )}
      <RadioGroup
        {...formContents.isCurrentEmployer}
        disabled={isFrozen}
        currentValue={hasCurrentEmployer}
        setCurrentValue={(value) =>
          dispatch(conventionSlice.actions.isCurrentEmployerChanged(value))
        }
        groupLabel={formContents.isCurrentEmployer.label}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />
      {hasCurrentEmployer && (
        <BeneficiaryCurrentEmployerFields disabled={isFrozen} />
      )}
    </>
  );
};
