import React from "react";
import {
  InternshipKind,
  isPeConnectIdentity,
  miniStageRestrictedDepartments,
} from "shared";
import {
  AgencySelector,
  departmentOptions,
} from "src/app/components/forms/commons/AgencySelector";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useRoute } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionAgenciesRetriever } from "src/core-logic/ports/AgencyGateway";

type ConventionAgencySelectorProps = {
  internshipKind: InternshipKind;
  disabled?: boolean;
  defaultAgencyId?: string;
  shouldListAll: boolean;
};

export const ConventionAgencySelector = ({
  internshipKind,
  disabled,
  shouldListAll,
}: ConventionAgencySelectorProps) => {
  const route = useRoute();
  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(internshipKind),
  );
  const {
    agencyId: agencyIdField,
    agencyDepartment: agencyDepartmentField,
    agencyKind: agencyKindField,
  } = getFormFields();

  const convention = useAppSelector(conventionSelectors.convention);

  const shouldLockToPeAgencies = !!(
    route.name === "conventionImmersion" &&
    route.params.jwt &&
    isPeConnectIdentity(convention?.signatories.beneficiary.federatedIdentity)
  );

  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);

  return (
    <AgencySelector
      fields={{
        agencyDepartmentField,
        agencyIdField,
        agencyKindField,
      }}
      shouldLockToPeAgencies={shouldLockToPeAgencies}
      shouldShowAgencyKindField={internshipKind === "immersion"}
      agencyDepartmentOptions={
        internshipKind === "immersion"
          ? departmentOptions
          : departmentOptions.filter((department) =>
              miniStageRestrictedDepartments.includes(department.value),
            )
      }
      agenciesRetriever={conventionAgenciesRetriever({
        internshipKind,
        shouldListAll,
        federatedIdentity,
      })}
      disabled={disabled}
    />
  );
};
