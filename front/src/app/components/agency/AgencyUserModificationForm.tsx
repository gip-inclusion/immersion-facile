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
    const validatedUserRoles = values.roles.filter(
      (role) => role !== "to-review",
    );
    match(mode)
      .with("add", () => {
        dispatch(
          icUsersAdminSlice.actions.createUserOnAgencyRequested({
            ...values,
            roles: validatedUserRoles,
            feedbackTopic: "agency-user",
          }),
        );
      })
      .with("update", () => {
        dispatch(
          icUsersAdminSlice.actions.updateUserOnAgencyRequested({
            ...values,
            roles: validatedUserRoles,
            feedbackTopic: "agency-user",
          }),
        );
      })
      .with("register", () => {
        dispatch(
          icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested({
            ...values,
            roles: validatedUserRoles,
          }),
        );
      })
      .exhaustive();

    closeModal();
  };

  useEffect(() => {
    reset(agencyUser);
  }, [agencyUser, reset]);

  const availableRoles = keys(agencyRoleToDisplay).filter(
    (role) => role !== "to-review",
  );
  const checkboxOptions = availableRoles.map((availableRole) => {
    return {
      label: agencyRoleToDisplay[availableRole].label,
      nativeInputProps: {
        name: register("roles").name,
        checked: values.roles.includes(availableRole),
        onChange: () => {
          const rolesToSet = values.roles.includes(availableRole)
            ? values.roles.filter((role) => role !== availableRole)
            : [...values.roles, availableRole];
          setValue("roles", rolesToSet, {
            shouldValidate: true,
          });
        },
      },
      hintText: agencyRoleToDisplay[availableRole].description,
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
          label="Recevoir les notifications pour toutes les conventions de cette structure"
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
