import React from "react";
import {
  AgencyOption,
  DepartmentCode,
  FederatedIdentity,
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
import { agencyGateway } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

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
      initialAgencies={[]}
      shouldLockToPeAgencies={shouldLockToPeAgencies}
      shouldShowAgencyKindField={internshipKind === "immersion"}
      agencyDepartmentOptions={
        internshipKind === "immersion"
          ? departmentOptions
          : departmentOptions.filter((department) =>
              miniStageRestrictedDepartments.includes(department.value),
            )
      }
      agenciesRetriever={agenciesRetriever({
        internshipKind,
        shouldListAll,
        federatedIdentity,
      })}
      disabled={disabled}
    />
  );
};

const agenciesRetriever = ({
  internshipKind,
  shouldListAll,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  shouldListAll: boolean;
  federatedIdentity: FederatedIdentity | null;
}): ((departmentCode: DepartmentCode) => Promise<AgencyOption[]>) => {
  if (internshipKind === "mini-stage-cci")
    return (departmentCode) =>
      agencyGateway.listMiniStageAgencies(departmentCode);
  if (shouldListAll)
    return (departmentCode) =>
      agencyGateway.listImmersionAgencies(departmentCode);
  return federatedIdentity && isPeConnectIdentity(federatedIdentity)
    ? (departmentCode) =>
        agencyGateway.listImmersionOnlyPeAgencies(departmentCode)
    : (departmentCode) => agencyGateway.listImmersionAgencies(departmentCode);
};
