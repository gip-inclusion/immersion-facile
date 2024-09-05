import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { keys } from "react-design-system";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  UserParamsForAgency,
  domElementIds,
  userParamsForAgencySchema,
} from "shared";
import {
  UserFormMode,
  agencyRoleToDisplay,
} from "src/app/components/agency/AgencyUsers";
import { EmailValidationInput } from "src/app/components/forms/commons/EmailValidationInput";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { match } from "ts-pattern";

export const AgencyUserModificationForm = ({
  agencyUser,
  closeModal,
  mode,
  agency,
}: {
  agencyUser: UserParamsForAgency & { isIcUser: boolean };
  closeModal: () => void;
  mode: UserFormMode;
  agency: AgencyDto;
}) => {
  const dispatch = useDispatch();

  const methods = useForm<UserParamsForAgency>({
    resolver: zodResolver(userParamsForAgencySchema),
    mode: "onTouched",
    defaultValues: agencyUser,
  });

  const { watch, register, setValue, handleSubmit, formState, reset } = methods;

  const values = watch();

  const getFieldError = makeFieldError(formState);

  const onValidSubmit = () => {
    match(mode)
      .with("add", () => {
        dispatch(
          icUsersAdminSlice.actions.createUserOnAgencyRequested({
            ...values,
            feedbackTopic: "agency-user",
          }),
        );
      })
      .with("update", () => {
        dispatch(
          icUsersAdminSlice.actions.updateUserOnAgencyRequested({
            ...values,
            feedbackTopic: "agency-user",
          }),
        );
      })
      .otherwise(() => {
        dispatch(
          icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested({
            ...values,
          }),
        );
      });

    closeModal();
  };

  useEffect(() => {
    reset(agencyUser);
  }, [agencyUser, reset]);

  const checkboxOptions = keys(agencyRoleToDisplay).map((roleKey) => {
    return {
      label: agencyRoleToDisplay[roleKey].label,
      nativeInputProps: {
        name: register("roles").name,
        checked: values.roles.includes(roleKey),
        onChange: () => {
          const rolesToSet = values.roles.includes(roleKey)
            ? values.roles.filter((role) => role !== roleKey)
            : [...values.roles, roleKey];
          setValue("roles", rolesToSet, {
            shouldValidate: true,
          });
        },
      },
    };
  });

  const checkboxOptionsWithFilter = () => {
    if (agency && agency.counsellorEmails.length === 0)
      return checkboxOptions.filter(
        (option) => option.label !== "Pré-validateur",
      );
    if (agency && agency.refersToAgencyId !== null)
      return checkboxOptions.filter((option) => option.label !== "Validateur");
    return checkboxOptions;
  };

  if (!agencyUser) return <></>;

  const [invalidEmailMessage, setInvalidEmailMessage] =
    useState<React.ReactNode | null>(null);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onValidSubmit)}>
        <EmailValidationInput
          label="Email"
          nativeInputProps={{
            ...register("email"),
            id: domElementIds.admin.agencyTab.editAgencyUserEmail,
          }}
          {...getFieldError("email")}
          disabled={agencyUser.isIcUser}
          onEmailValidationFeedback={({ state, stateRelatedMessage }) => {
            setInvalidEmailMessage(
              state === "error" ? stateRelatedMessage : null,
            );
          }}
        />

        <Checkbox
          id={domElementIds.admin.agencyTab.editAgencyManageUserCheckbox}
          legend="Rôles :"
          {...getFieldError("roles")}
          options={checkboxOptionsWithFilter()}
        />

        <ToggleSwitch
          id={domElementIds.admin.agencyTab.editAgencyUserIsNotifiedByEmail}
          label="Recevoir les notifications par email"
          checked={values.isNotifiedByEmail}
          onChange={() =>
            setValue("isNotifiedByEmail", !values.isNotifiedByEmail, {
              shouldValidate: true,
            })
          }
        />

        {invalidEmailMessage}
        <Button
          id={domElementIds.admin.agencyTab.editAgencyUserRoleSubmitButton}
          className={fr.cx("fr-mt-2w")}
          disabled={invalidEmailMessage != null}
        >
          Valider
        </Button>
      </form>
    </FormProvider>
  );
};
