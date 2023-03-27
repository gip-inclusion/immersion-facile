import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { keys } from "ramda";
import React, { useEffect } from "react";
import { SectionTitle } from "react-design-system";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  cleanStringToHTMLAttribute,
  ConventionReadDto,
  InternshipKind,
  isBeneficiaryStudent,
  levelsOfEducation,
} from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  useFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
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
  const { register, getValues, setValue, formState } =
    useFormContext<ConventionReadDto>();

  const values = getValues();
  const dispatch = useDispatch();
  const t = useConventionTexts(values.internshipKind);
  const getFieldError = makeFieldError(formState);
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();

  useEffect(() => {
    if (userFieldsAreFilled) {
      const valuesToUpdate = {
        "signatories.beneficiary.firstName": connectedUser.firstName,
        "signatories.beneficiary.lastName": connectedUser.lastName,
        "signatories.beneficiary.email": connectedUser.email,
      };
      keys(valuesToUpdate).forEach((key) => setValue(key, valuesToUpdate[key]));
    }
  }, [userFieldsAreFilled]);

  useEffect(() => {
    // TODO : do this in Redux ?
    const initialValues = values.signatories.beneficiaryRepresentative;
    setValue(
      "signatories.beneficiaryRepresentative",
      isMinor && initialValues
        ? {
            ...initialValues,
            role: "beneficiary-representative",
          }
        : undefined,
      {
        shouldValidate: true,
      },
    );
  }, [isMinor]);

  useEffect(() => {
    // TODO : do this in Redux ?
    const initialValues = values.signatories.beneficiaryCurrentEmployer;
    setValue(
      "signatories.beneficiaryCurrentEmployer",
      hasCurrentEmployer && initialValues
        ? {
            ...initialValues,
            role: "beneficiary-current-employer",
          }
        : undefined,
      {
        shouldValidate: true,
      },
    );
  }, [hasCurrentEmployer]);

  const levelsOfEducationToSelectOption = levelsOfEducation.map(
    (level: string) => ({ label: level, value: level }),
  );
  return (
    <>
      <SectionTitle>{t.beneficiarySection.title}</SectionTitle>
      <Input
        {...formContents["signatories.beneficiary.firstName"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.firstName"],
          ...register("signatories.beneficiary.firstName"),
          ...(userFieldsAreFilled ? { value: connectedUser.firstName } : {}),
        }}
        disabled={isFrozen || userFieldsAreFilled}
        {...getFieldError("signatories.beneficiary.firstName")}
      />
      <Input
        {...formContents["signatories.beneficiary.lastName"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.lastName"],
          ...register("signatories.beneficiary.lastName"),
          ...(userFieldsAreFilled ? { value: connectedUser.lastName } : {}),
        }}
        disabled={isFrozen || userFieldsAreFilled}
        {...getFieldError("signatories.beneficiary.lastName")}
      />

      <Input
        {...formContents["signatories.beneficiary.birthdate"]}
        disabled={isFrozen}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.birthdate"],
          ...register("signatories.beneficiary.birthdate"),
          type: "date",
          max: "9999-12-31",
          id: cleanStringToHTMLAttribute("signatories.beneficiary.birthdate"),
        }}
        {...getFieldError("signatories.beneficiary.birthdate")}
      />
      <Input
        {...formContents["signatories.beneficiary.email"]}
        disabled={isFrozen || userFieldsAreFilled}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.email"],
          ...register("signatories.beneficiary.email"),
          ...(userFieldsAreFilled ? { value: connectedUser.email } : {}),
          type: "email",
        }}
        {...getFieldError("signatories.beneficiary.email")}
      />
      {values.signatories.beneficiary.email && <ConventionEmailWarning />}
      <Input
        {...formContents["signatories.beneficiary.phone"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.phone"],
          ...register("signatories.beneficiary.phone"),
          type: "tel",
        }}
        disabled={isFrozen}
        {...getFieldError("signatories.beneficiary.phone")}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Select
          {...formContents["signatories.beneficiary.levelOfEducation"]}
          disabled={isFrozen}
          options={levelsOfEducationToSelectOption}
          nativeSelectProps={{
            ...formContents["signatories.beneficiary.levelOfEducation"],
            ...register("signatories.beneficiary.levelOfEducation"),
            value: isBeneficiaryStudent(values.signatories.beneficiary)
              ? values.signatories.beneficiary.levelOfEducation
              : "",
          }}
          {...getFieldError("signatories.beneficiary.levelOfEducation")}
        />
      )}
      <Input
        {...formContents["signatories.beneficiary.financiaryHelp"]}
        textArea
        nativeTextAreaProps={{
          ...formContents["signatories.beneficiary.financiaryHelp"],
          ...register("signatories.beneficiary.financiaryHelp"),
        }}
        disabled={isFrozen}
        {...getFieldError("signatories.beneficiary.financiaryHelp")}
      />
      <RadioButtons
        {...formContents.isMinor}
        legend={formContents.isMinor.label}
        hintText={formContents.isMinor.description}
        disabled={isFrozen}
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            defaultChecked: Boolean(option.nativeInputProps.value) === isMinor,
            onChange: () => {
              dispatch(
                conventionSlice.actions.isMinorChanged(
                  Boolean(option.nativeInputProps.value),
                ),
              );
            },
          },
        }))}
      />
      {isMinor ? (
        <BeneficiaryRepresentativeFields disabled={isFrozen} />
      ) : (
        <BeneficiaryEmergencyContactFields disabled={isFrozen} />
      )}
      {internshipKind !== "mini-stage-cci" && (
        <>
          <RadioButtons
            {...formContents.isCurrentEmployer}
            disabled={isFrozen}
            legend={formContents.isCurrentEmployer.label}
            hintText={formContents.isCurrentEmployer.description}
            options={booleanSelectOptions.map((option) => ({
              ...option,
              nativeInputProps: {
                ...option.nativeInputProps,
                defaultChecked:
                  Boolean(option.nativeInputProps.value) === hasCurrentEmployer,
                onChange: () => {
                  dispatch(
                    conventionSlice.actions.isCurrentEmployerChanged(
                      Boolean(option.nativeInputProps.value),
                    ),
                  );
                },
              },
            }))}
          />

          {hasCurrentEmployer && (
            <BeneficiaryCurrentEmployerFields disabled={isFrozen} />
          )}
        </>
      )}
    </>
  );
};
