import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AgencyOption,
  ConventionReadDto,
  DepartmentCode,
  FederatedIdentity,
  InternshipKind,
  isPeConnectIdentity,
  miniStageRestrictedDepartments,
  sortByPropertyCaseInsensitive,
} from "shared";
import { AllowedAgencyKindToAdd } from "src/app/components/forms/agency/agencyKindToLabel";
import {
  AgencySelector,
  departmentOptions,
} from "src/app/components/forms/convention/sections/agency/AgencySelector";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useRoute } from "src/app/routes/routes";
import { agencyGateway } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

type AgencySelectorProps = {
  internshipKind: InternshipKind;
  disabled?: boolean;
  defaultAgencyId?: string;
  shouldListAll: boolean;
};

export const ConventionAgencySelector = ({
  internshipKind,
  disabled,
  defaultAgencyId,
  shouldListAll,
}: AgencySelectorProps) => {
  const route = useRoute();
  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(internshipKind),
  );
  const {
    agencyId: agencyIdField,
    agencyDepartment: agencyDepartmentField,
    agencyKind: agencyKindField,
  } = getFormFields();

  const {
    register,
    getValues,
    setValue,
    formState: { errors, touchedFields },
  } = useFormContext<ConventionReadDto>();
  const agencyDepartmentStored = useAppSelector(
    conventionSelectors.agencyDepartment,
  );
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const convention = useAppSelector(conventionSelectors.convention);
  const agencyDepartment = getValues("agencyDepartment");
  const [isLoading, setIsLoading] = useState(false);

  const [loadingError, setLoadingError] = useState(false);
  const dispatch = useDispatch();
  const shouldLockToPeAgencies = !!(
    route.name === "conventionImmersion" &&
    route.params.jwt &&
    isPeConnectIdentity(convention?.signatories.beneficiary.federatedIdentity)
  );

  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const agencyIdFieldName = agencyIdField.name as keyof ConventionReadDto;
  const agencyDepartmentFiledName =
    agencyDepartmentField.name as keyof ConventionReadDto;

  useEffect(() => {
    if (!agencyDepartment) return;

    dispatch(
      conventionSlice.actions.agencyDepartementChangeRequested(
        agencyDepartment,
      ),
    );
    setIsLoading(true);
    agenciesRetriever({
      internshipKind,
      shouldListAll,
      departmentCode: agencyDepartment,
      federatedIdentity,
    })
      .then((retrievedAgencies) => {
        setAgencies(sortByPropertyCaseInsensitive("name")(retrievedAgencies));
        if (
          defaultAgencyId &&
          isDefaultAgencyOnAgenciesAndEnabled(
            disabled,
            defaultAgencyId,
            retrievedAgencies,
          )
        )
          setValue(agencyIdFieldName, defaultAgencyId);
        else setValue(agencyIdFieldName, "");
        setLoadingError(false);
      })
      .catch((e: any) => {
        //eslint-disable-next-line no-console
        console.log("AgencySelector", e);
        setAgencies([]);
        setLoadingError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [agencyDepartment]);

  useEffect(() => {
    if (agencyDepartmentStored) {
      setValue(agencyDepartmentFiledName, agencyDepartmentStored);
    }
  }, [agencyDepartmentStored]);

  const error = errors[agencyIdFieldName];
  const touched = touchedFields[agencyIdFieldName];
  const userError: boolean = !!(touched && error);
  const showError: boolean = userError || loadingError;

  return (
    <AgencySelector
      isLoading={isLoading}
      showError={showError}
      fields={{
        agencyDepartmentField,
        agencyIdField,
        agencyKindField,
      }}
      initialAgencies={agencies}
      initialAgencyDepartment={agencyDepartment}
      shouldLockToPeAgencies={shouldLockToPeAgencies}
      shouldShowAgencyKindField={internshipKind === "immersion"}
      agencyDepartmentOptions={
        internshipKind === "immersion"
          ? departmentOptions
          : departmentOptions.filter((department) =>
              miniStageRestrictedDepartments.includes(department.value),
            )
      }
    />
  );
};

const isDefaultAgencyOnAgenciesAndEnabled = (
  disabled: boolean | undefined,
  defaultAgencyId: string,
  agencies: AgencyOption[],
) => !disabled && agencies.map((agency) => agency.id).includes(defaultAgencyId);

const agenciesRetriever = ({
  internshipKind,
  departmentCode,
  shouldListAll,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  departmentCode: DepartmentCode;
  shouldListAll: boolean;
  federatedIdentity: FederatedIdentity | null;
}): Promise<AgencyOption[]> => {
  if (internshipKind === "mini-stage-cci")
    return agencyGateway.listMiniStageAgencies(departmentCode);
  if (shouldListAll) return agencyGateway.listImmersionAgencies(departmentCode);
  return federatedIdentity && isPeConnectIdentity(federatedIdentity)
    ? agencyGateway.listImmersionOnlyPeAgencies(departmentCode)
    : agencyGateway.listImmersionAgencies(departmentCode);
};
