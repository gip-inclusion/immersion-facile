import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";

import { type ReactNode, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  type UserParamsForAgency,
  domElementIds,
  keys,
  toLowerCaseWithoutDiacritics,
  userParamsForAgencySchema,
} from "shared";
import type { AgencyOverviewRouteName } from "src/app/components/forms/agency/AgencyOverview";
import { EmailValidationInput } from "src/app/components/forms/commons/EmailValidationInput";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { P, match } from "ts-pattern";
import { agencyRolesToDisplay } from "../../contents/userRolesToDisplay";

export const AgencyUserModificationForm = ({
  agencyUser,
  closeModal,
  agencyHasRefersTo,
  isEmailDisabled,
  areRolesDisabled,
  onSubmit,
  routeName,
}: {
  agencyUser: UserParamsForAgency & { isIcUser: boolean };
  closeModal: () => void;
  agencyHasRefersTo: boolean;
  isEmailDisabled?: boolean;
  areRolesDisabled?: boolean;
  onSubmit: (userParamsForAgency: UserParamsForAgency) => void;
  routeName: AgencyOverviewRouteName;
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

  const availableRoles = keys(agencyRolesToDisplay).filter(
    (role) => role !== "to-review",
  );
  const checkboxOptions = availableRoles.map((availableRole) => {
    return {
      label: agencyRolesToDisplay[availableRole].label,
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
      hintText: agencyRolesToDisplay[availableRole].description,
    };
  });

  const checkboxOptionsWithFilter = () => {
    if (agencyHasRefersTo)
      return checkboxOptions.filter((option) => option.label !== "Validateur");
    return checkboxOptions;
  };

  if (!agencyUser) return null;

  const [invalidEmailMessage, setInvalidEmailMessage] =
    useState<ReactNode | null>(null);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onValidSubmit)}>
        <EmailValidationInput
          label="Email"
          nativeInputProps={{
            ...register("email", {
              setValueAs: (value) => toLowerCaseWithoutDiacritics(value),
            }),
            id: agencyUserModificationFormIds(routeName).editAgencyUserEmail,
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
          id={
            agencyUserModificationFormIds(routeName)
              .editAgencyManageUserCheckbox
          }
          legend="Rôles :"
          {...getFieldError("roles")}
          options={checkboxOptionsWithFilter()}
          disabled={!!areRolesDisabled}
        />

        <ToggleSwitch
          id={
            agencyUserModificationFormIds(routeName)
              .editAgencyUserIsNotifiedByEmail
          }
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
          id={
            agencyUserModificationFormIds(routeName)
              .editAgencyUserRoleSubmitButton
          }
          className={fr.cx("fr-mt-2w")}
          disabled={invalidEmailMessage != null}
        >
          Valider
        </Button>
      </form>
    </FormProvider>
  );
};

const agencyUserModificationFormIds = (routeName: AgencyOverviewRouteName) =>
  match(routeName)
    .with(
      P.union("adminAgencies", "adminAgencyDetail"),
      () => domElementIds.admin.agencyTab,
    )
    .with(
      "agencyDashboardAgencyDetails",
      () => domElementIds.agencyDashboard.agencyDetails,
    )
    .with("myProfile", () => domElementIds.profile)
    .exhaustive();
