import { useFormikContext } from "formik";
import React, { useEffect } from "react";
import { SectionTitle, SelectOption } from "react-design-system";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  InternshipKind,
  isBeneficiaryStudent,
  levelsOfEducation,
} from "shared";
import { DateInput } from "src/app/components/forms/commons/DateInput";
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { BeneficiaryCurrentEmployerFields } from "./BeneficiaryCurrentEmployerFields";
import { BeneficiaryEmergencyContactFields } from "./BeneficiaryEmergencyContactFields";
import { BeneficiaryRepresentativeFields } from "./BeneficiaryRepresentativeFields";

type beneficiaryFormSectionProperties = {
  isFrozen: boolean | undefined;
  internshipKind: InternshipKind;
};
export const BeneficiaryFormSection = ({
  isFrozen,
  internshipKind,
}: beneficiaryFormSectionProperties): JSX.Element => {
  const isMinor = useAppSelector(conventionSelectors.isMinor);
  const hasCurrentEmployer = useAppSelector(
    conventionSelectors.hasCurrentEmployer,
  );
  const isSuccessfullyPeConnected = useAppSelector(
    authSelectors.isSuccessfullyPeConnected,
  );
  const connectedUser = useAppSelector(authSelectors.connectedUser);
  const userFieldsAreFilled = isSuccessfullyPeConnected && !!connectedUser;

  const { setFieldValue, values } = useFormikContext<ConventionDto>();
  const dispatch = useDispatch();
  const t = useConventionTextsFromFormikContext();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  useEffect(() => {
    if (userFieldsAreFilled)
      Object.entries({
        "signatories.beneficiary.firstName": connectedUser.firstName,
        "signatories.beneficiary.lastName": connectedUser.lastName,
        "signatories.beneficiary.email": connectedUser.email,
      }).forEach(([key, value]) => setFieldValue(key, value));
  }, [userFieldsAreFilled]);
  // const isFilledField = (fieldValue: string) => fieldValue.length > 0;
  // const shouldDisableField = (fieldValue: string) =>
  //   isPEConnected && isFilledField(fieldValue);
  const levelsOfEducationToSelectOption: SelectOption[] = levelsOfEducation.map(
    (level: string) => ({ label: level, value: level }),
  );

  return (
    <>
      <SectionTitle>{t.beneficiarySection.title}</SectionTitle>
      <TextInput
        {...formContents["signatories.beneficiary.firstName"]}
        {...(userFieldsAreFilled ? { value: connectedUser.firstName } : {})}
        type="text"
        disabled={isFrozen || userFieldsAreFilled}
      />
      <TextInput
        {...formContents["signatories.beneficiary.lastName"]}
        {...(userFieldsAreFilled ? { value: connectedUser.lastName } : {})}
        type="text"
        disabled={isFrozen || userFieldsAreFilled}
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
        {...(userFieldsAreFilled ? { value: connectedUser.email } : {})}
        type="email"
        disabled={isFrozen || userFieldsAreFilled}
      />
      {values.signatories.beneficiary.email && <ConventionEmailWarning />}
      <TextInput
        {...formContents["signatories.beneficiary.phone"]}
        type="tel"
        disabled={isFrozen}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Select
          {...formContents["signatories.beneficiary.levelOfEducation"]}
          disabled={isFrozen}
          options={levelsOfEducationToSelectOption}
          nativeSelectProps={{
            onChange: (event) =>
              setFieldValue(
                formContents["signatories.beneficiary.levelOfEducation"].name,
                event.currentTarget.value,
              ),
            value: isBeneficiaryStudent(values.signatories.beneficiary)
              ? values.signatories.beneficiary.levelOfEducation
              : "",
          }}
        />
      )}
      <TextInput
        {...formContents["signatories.beneficiary.financiaryHelp"]}
        type="text"
        multiline={true}
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
      {internshipKind !== "mini-stage-cci" && (
        <>
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
      )}
    </>
  );
};
