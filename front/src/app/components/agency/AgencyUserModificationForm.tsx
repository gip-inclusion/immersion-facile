import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { keys } from "react-design-system";
import { FormProvider, useForm } from "react-hook-form";
import {
  UserParamsForAgency,
  domElementIds,
  toLowerCaseWithoutDiacritics,
  userParamsForAgencySchema,
} from "shared";
import { agencyRoleToDisplay } from "src/app/components/agency/AgencyUsers";
import { AgencyOverviewLocation } from "src/app/components/forms/agency/AgencyOverview";
import { EmailValidationInput } from "src/app/components/forms/commons/EmailValidationInput";
import { makeFieldError } from "src/app/hooks/formContents.hooks";

export const AgencyUserModificationForm = ({
  agencyUser,
  closeModal,
  agencyHasRefersTo,
  isEmailDisabled,
  areRolesDisabled,
  onSubmit,
  location,
}: {
  agencyUser: UserParamsForAgency & { isIcUser: boolean };
  closeModal: () => void;
  agencyHasRefersTo: boolean;
  isEmailDisabled?: boolean;
  areRolesDisabled?: boolean;
  onSubmit: (userParamsForAgency: UserParamsForAgency) => void;
  location: AgencyOverviewLocation | "profile";
}) => {
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
    onSubmit({
      ...values,
      roles: validatedUserRoles,
    });
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
    if (agencyHasRefersTo)
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
            ...register("email", {
              setValueAs: (value) => toLowerCaseWithoutDiacritics(value),
            }),
            id: agencyUserModificationFormIds(location)?.emailFieldId,
            onBlur: (event) => {
              setValue(
                "email",
                toLowerCaseWithoutDiacritics(event.currentTarget.value),
              );
            },
          }}
          {...getFieldError("email")}
          disabled={isEmailDisabled ?? agencyUser.isIcUser}
          onEmailValidationFeedback={({ state, stateRelatedMessage }) => {
            setInvalidEmailMessage(
              state === "error" ? stateRelatedMessage : null,
            );
          }}
        />

        <Checkbox
          id={agencyUserModificationFormIds(location)?.rolesCheckBoxId}
          legend="Rôles :"
          {...getFieldError("roles")}
          options={checkboxOptionsWithFilter()}
          disabled={!!areRolesDisabled}
        />

        <ToggleSwitch
          id={agencyUserModificationFormIds(location)?.notificationToggleId}
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
          id={agencyUserModificationFormIds(location)?.submitButtonId}
          className={fr.cx("fr-mt-2w")}
          disabled={invalidEmailMessage != null}
        >
          Valider
        </Button>
      </form>
    </FormProvider>
  );
};

const agencyUserModificationFormIds = (
  location: AgencyOverviewLocation | "profile",
) => {
  if (location === "admin")
    return {
      submitButtonId:
        domElementIds.admin.agencyTab.editAgencyUserRoleSubmitButton,
      notificationToggleId:
        domElementIds.admin.agencyTab.editAgencyUserIsNotifiedByEmail,
      emailFieldId: domElementIds.admin.agencyTab.editAgencyUserEmail,
      rolesCheckBoxId:
        domElementIds.admin.agencyTab.editAgencyManageUserCheckbox,
    };

  if (location === "agency-dashboard") {
    return {
      submitButtonId:
        domElementIds.agencyDashboard.agencyDetails
          .editAgencyUserRoleSubmitButton,
      notificationToggleId:
        domElementIds.agencyDashboard.agencyDetails
          .editAgencyUserIsNotifiedByEmail,
      emailFieldId:
        domElementIds.agencyDashboard.agencyDetails.editAgencyUserEmail,
      rolesCheckBoxId:
        domElementIds.agencyDashboard.agencyDetails
          .editAgencyManageUserCheckbox,
    };
  }
  if (location === "profile") {
    return {
      submitButtonId: domElementIds.profile.editAgencyUserRoleSubmitButton,
      notificationToggleId:
        domElementIds.profile.editAgencyUserIsNotifiedByEmail,
      emailFieldId: domElementIds.profile.editAgencyUserEmail,
      rolesCheckBoxId: domElementIds.profile.editAgencyManageUserCheckbox,
    };
  }
};
