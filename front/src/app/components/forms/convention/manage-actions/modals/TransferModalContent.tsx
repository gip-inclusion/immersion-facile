import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { forwardRef } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type ConventionDto,
  type DepartmentCode,
  type TransferConventionToAgencyRequestDto,
  domElementIds,
  makeListAgencyOptionsKindFilter,
  transferConventionToAgencyRequestSchema,
} from "shared";
import {
  AgencySelector,
  departmentOptions,
} from "src/app/components/forms/commons/AgencySelector";
import {
  type ModalContentRef,
  useExposeFormModalContentRef,
} from "src/app/components/forms/convention/manage-actions/ManageActionModalWrapper";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";

export const TransferModalContent = forwardRef<
  ModalContentRef,
  {
    onSubmit: (params: TransferConventionToAgencyRequestDto) => void;
    closeModal: () => void;
    convention: ConventionDto;
  }
>(({ onSubmit, closeModal, convention }, ref) => {
  const dispatch = useDispatch();
  const agencyOptions = useAppSelector(agenciesSelectors.options);
  const isAgenciesLoading = useAppSelector(agenciesSelectors.isLoading);
  const agenciesFeedback = useAppSelector(agenciesSelectors.feedback);
  const methods = useForm<TransferConventionToAgencyRequestDto>({
    resolver: zodResolver(transferConventionToAgencyRequestSchema),
    mode: "onTouched",
    defaultValues: {
      agencyId: "",
      conventionId: convention.id,
      justification: "",
    },
  });
  const { register, handleSubmit, formState } = methods;
  const onFormSubmit: SubmitHandler<TransferConventionToAgencyRequestDto> = ({
    agencyId,
    conventionId,
    justification,
  }) => {
    onSubmit({ agencyId, conventionId, justification });
    closeModal();
  };

  useExposeFormModalContentRef(ref, {
    handleSubmit,
    onFormSubmit,
    submitButtonLabel: "Terminer",
    cancelButtonLabel: "Annuler et revenir en arrière",
    submitButtonId: domElementIds.manageConvention.transferToAgencySubmitButton,
    cancelButtonId: domElementIds.manageConvention.transferToAgencyCancelButton,
  });
  const getFieldError = makeFieldError(formState);

  const onDepartmentCodeChangedMemoized = useCallback(
    (departmentCode: DepartmentCode) =>
      dispatch(
        agenciesSlice.actions.fetchAgencyOptionsRequested({
          filterKind: makeListAgencyOptionsKindFilter({
            internshipKind: convention.internshipKind,
            shouldListAll: false,
            federatedIdentity: null,
          }),
          departmentCode,
        }),
      ),
    [dispatch, convention.internshipKind],
  );

  const filteredAgencyOptions = agencyOptions.filter((agency) => {
    return agency.id !== convention.agencyId;
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <AgencySelector
          fields={{
            agencyDepartmentField: {
              name: "agencyDepartment",
              label: "Département",
              required: true,
              id: "agencyDepartment",
              placeholder: "Sélectionnez un département",
            },
            agencyIdField: {
              id: "agencyId",
              label: "Organisme",
              name: "agencyId",
              required: true,
              placeholder: "Sélectionnez un organisme",
            },
            agencyKindField: {
              name: "agencyKind",
              label: "Type d'organisme",
              required: true,
              id: "agencyKind",
              placeholder: "Veuillez choisir un type d'organisme",
            },
          }}
          shouldLockToPeAgencies={false}
          shouldFilterDelegationPrescriptionAgencyKind={false}
          shouldShowAgencyKindField={convention.internshipKind === "immersion"}
          agencyDepartmentOptions={departmentOptions}
          onDepartmentCodeChangedMemoized={onDepartmentCodeChangedMemoized}
          agencyOptions={filteredAgencyOptions}
          isLoading={isAgenciesLoading}
          isFetchAgencyOptionsError={agenciesFeedback.kind === "errored"}
        />
        <Input
          textArea
          label="justification"
          nativeTextAreaProps={{
            ...register("justification"),
          }}
          {...getFieldError("justification")}
        />
        <ButtonsGroup
          alignment="center"
          inlineLayoutWhen="always"
          buttons={[
            {
              type: "button",
              priority: "secondary",
              onClick: () => {
                closeModal();
              },
              nativeButtonProps: {
                id: domElementIds.manageConvention.transferToAgencyCancelButton,
              },
              children: "Annuler et revenir en arrière",
            },
            {
              type: "submit",
              nativeButtonProps: {
                id: domElementIds.manageConvention.transferToAgencySubmitButton,
              },
              children: "Terminer",
            },
          ]}
        />
      </form>
    </FormProvider>
  );
});
