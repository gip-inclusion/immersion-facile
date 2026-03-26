import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { uniqBy } from "ramda";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  establishmentsRoles,
  type FormEstablishmentUserRight,
  formEstablishmentUserRightSchema,
  localization,
  type SiretDto,
} from "shared";
import { userRolesToDisplay } from "src/app/contents/userRolesToDisplay";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { type routes, useRoute } from "src/app/routes/routes";
import {
  type createFormModal,
  useFormModal,
} from "src/app/utils/createFormModal";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import type { Route } from "type-route";

type EstablishmentUserUserFormProps = {
  alreadyExistingUserRight:
    | FormEstablishmentUserRight
    | Partial<FormEstablishmentUserRight>
    | null;
  establishmentUsersEditModal: ReturnType<typeof createFormModal>;
  selectedEstablishmentSiret?: SiretDto | undefined;
};

export const EstablishmentUserForm = ({
  alreadyExistingUserRight,
  establishmentUsersEditModal,
  selectedEstablishmentSiret,
}: EstablishmentUserUserFormProps) => {
  const formEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const route = useRoute() as Route<
    | typeof routes.establishmentDashboardFormEstablishment
    | typeof routes.myProfileEstablishmentRegistration
  >;
  const isEstablishmentDashboardFormEstablishment =
    route.name === "establishmentDashboardFormEstablishment";
  const isMyProfileEstablishmentRegistration =
    route.name === "myProfileEstablishmentRegistration";
  const dispatch = useDispatch();
  const emptyValues = useRef({
    email: "",
    phone: "",
    job: "",
    role: undefined,
    shouldReceiveDiscussionNotifications: false,
    isMainContactByPhone: false,
  });

  const defaultValues = { ...emptyValues.current, ...alreadyExistingUserRight };

  const methods = useForm<FormEstablishmentUserRight>({
    resolver: zodResolver(formEstablishmentUserRightSchema),
    defaultValues,
  });

  const {
    register,
    setValue,
    watch,
    reset,
    formState: { errors },
    handleSubmit,
  } = methods;

  const { formId } = useFormModal();

  const mergeUserRights = (
    userRights: FormEstablishmentUserRight[],
    userRightToMerge: FormEstablishmentUserRight,
  ) => {
    const userRightsWithoutPreviousOne = userRights.filter(
      (userRight) => userRight.email !== userRightToMerge.email,
    );

    return uniqBy(
      (userRight) => userRight.email,
      [userRightToMerge, ...userRightsWithoutPreviousOne],
    );
  };

  const onSubmit = (data: FormEstablishmentUserRight) => {
    if (isEstablishmentDashboardFormEstablishment) {
      const updatedFormEstablishment = {
        ...formEstablishment,
        userRights: mergeUserRights(formEstablishment.userRights, data),
      };
      dispatch(
        establishmentSlice.actions.updateEstablishmentRequested({
          establishmentUpdate: {
            formEstablishment: updatedFormEstablishment,
            jwt: connectedUserJwt ?? "",
          },
          feedbackTopic: "establishment-dashboard-users-rights",
        }),
      );
    }
    if (
      isMyProfileEstablishmentRegistration &&
      connectedUserJwt &&
      selectedEstablishmentSiret
    ) {
      dispatch(
        establishmentSlice.actions.userRegistrationOnEstablishmentRequested({
          siret: selectedEstablishmentSiret,
          userRight: data,
          feedbackTopic: "my-profile-establishment-registration",
          jwt: connectedUserJwt,
        }),
      );
    }
    establishmentUsersEditModal.close();
  };

  useEffect(() => {
    reset(defaultValues);
  }, [alreadyExistingUserRight, reset]);

  const values = watch();

  return (
    <>
      {values.email && isEstablishmentDashboardFormEstablishment && (
        <p>
          Pour modifier le nom, prénom ou l'email, l'utilisateur doit passer par
          son compte ProConnect créé avec l'email :{" "}
          <strong>{values.email}</strong>
        </p>
      )}
      <form
        id={formId}
        onSubmit={(event) => {
          event.stopPropagation();
          handleSubmit(onSubmit)(event);
        }}
      >
        {!alreadyExistingUserRight?.email && (
          <Input
            label="Email"
            nativeInputProps={{
              ...register("email"),
            }}
          />
        )}
        <Input
          label="Téléphone *"
          nativeInputProps={{
            ...register("phone"),
          }}
          {...(errors.phone && {
            state: "error",
            stateRelatedMessage: localization.required,
          })}
        />
        <Input
          label="Fonction *"
          nativeInputProps={{
            ...register("job"),
          }}
          {...(errors.job && {
            state: "error",
            stateRelatedMessage: localization.required,
          })}
        />
        <RadioButtons
          legend="Rôle"
          options={establishmentsRoles.map((role) => ({
            label: userRolesToDisplay[role].label,
            hintText: userRolesToDisplay[role].description,
            nativeInputProps: {
              checked: values.role === role,
              value: role,
              onChange: () => {
                setValue("role", role);
              },
            },
          }))}
        />

        <ToggleSwitch
          label="Recevoir les notifications pour toutes les candidatures de cet établissement"
          inputTitle="Recevoir les notifications pour toutes les candidatures de cet établissement"
          onChange={(checked) => {
            setValue("shouldReceiveDiscussionNotifications", checked);
          }}
          checked={values.shouldReceiveDiscussionNotifications}
        />
      </form>
    </>
  );
};
