import React from "react";
import { useDispatch } from "react-redux";
import { getConventionFieldName } from "shared";
import { Notification } from "react-design-system";
import { RadioGroup } from "src/app/components/RadioGroup";
import { BeneficiaryRepresentativeFields } from "src/app/pages/Convention/ConventionFields/Sections/Beneficiary/BeneficiaryRepresentativeFields";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { TextInput } from "src/uiComponents/form/TextInput";
import { BeneficiaryCurrentEmployerFields } from "./BeneficiaryCurrentEmployerFields";

export const BeneficiaryCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const isMinor = useAppSelector(conventionSelectors.isMinor);
  const hasCurrentEmployer = useAppSelector(
    conventionSelectors.hasCurrentEmployer,
  );
  const dispatch = useDispatch();
  const t = useConventionTextsFromFormikContext();

  return (
    <>
      <TextInput
        label={`${t.beneficiary.firstNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.firstName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.lastNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.lastName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.email.label} *`}
        name={getConventionFieldName("signatories.beneficiary.email")}
        type="email"
        placeholder={t.beneficiary.email.placeholder}
        description={t.beneficiary.email.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.phone.label} *`}
        name={getConventionFieldName("signatories.beneficiary.phone")}
        type="tel"
        placeholder={t.beneficiary.phone.placeholder}
        description={t.beneficiary.phone.description}
        disabled={disabled}
      />
      <RadioGroup
        id="is-minor"
        disabled={disabled}
        currentValue={isMinor}
        setCurrentValue={(value) =>
          dispatch(conventionSlice.actions.isMinorChanged(value))
        }
        groupLabel={`${t.beneficiary.isMinorLabel} *`}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />

      {isMinor ? (
        <BeneficiaryRepresentativeFields disabled={disabled} />
      ) : (
        <>
          <TextInput
            label={t.emergencyContact.nameLabel}
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContact",
            )}
            type="text"
            placeholder=""
            description=""
            disabled={disabled}
          />
          <TextInput
            label={t.emergencyContact.phone.label}
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContactPhone",
            )}
            type="tel"
            placeholder={t.emergencyContact.phone.placeholder}
            description=""
            disabled={disabled}
          />
        </>
      )}

      <RadioGroup
        id="is-current-employer"
        disabled={disabled}
        currentValue={hasCurrentEmployer}
        setCurrentValue={(value) =>
          dispatch(conventionSlice.actions.isCurrentEmployerChanged(value))
        }
        groupLabel={`${t.beneficiaryCurrentEmployer.hasCurrentEmployerLabel} *`}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />
      <Notification title={""} type={"info"} className="fr-my-2w">
        <strong>{t.beneficiaryCurrentEmployer.notNeededAgreement}</strong>
      </Notification>
      {hasCurrentEmployer && (
        <BeneficiaryCurrentEmployerFields disabled={disabled} />
      )}
    </>
  );
};
