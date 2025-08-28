import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { Table } from "@codegouvfr/react-dsfr/Table";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { uniqBy } from "ramda";
import { Fragment, useEffect, useRef, useState } from "react";
import { NotificationIndicator } from "react-design-system";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  domElementIds,
  establishmentsRoles,
  type FormEstablishmentUserRight,
  formEstablishmentUserRightSchema,
  localization,
} from "shared";
import { UsersWithoutNameHint } from "src/app/components/agency/UsersWithoutNameHint";
import { Feedback } from "src/app/components/feedback/Feedback";
import { userRolesToDisplay } from "src/app/contents/userRolesToDisplay";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";

const establishmentUsersEditModal = createModal({
  id: "establishment-users-edit-modal",
  isOpenedByDefault: false,
});

const establishmentUsersDeleteModal = createModal({
  id: "establishment-users-delete-modal",
  isOpenedByDefault: false,
});

export const EstablishmentUsersList = () => {
  const formEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );
  const [editingUserRight, setEditingUserRight] =
    useState<FormEstablishmentUserRight | null>(null);

  if (!formEstablishment?.userRights) return null;

  const headers = [
    "Utilisateur",
    "Informations de contact",
    "Rôle",
    "Notifications (candidatures)",
    "Actions",
  ];

  const data = formEstablishment.userRights.map((userRight, index) => {
    const isLastAdmin =
      userRight.role === "establishment-admin" &&
      formEstablishment.userRights.filter(
        (userRight) => userRight.role === "establishment-admin",
      ).length === 1;
    return getEstablishmentUserRow({
      userRight,
      isLastAdmin,
      index,
      setEditingUserRight,
    });
  });
  return (
    <div className="fr-mt-4w">
      <div className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
        <div>
          <h3 className={fr.cx("fr-h6", "fr-mb-0")}>Utilisateurs</h3>
          <UsersWithoutNameHint />
        </div>
        <div className={fr.cx("fr-ml-auto")}>
          <Button
            iconId="fr-icon-file-add-line"
            className={fr.cx("fr-m-0")}
            priority="secondary"
            size="small"
            type="button"
            onClick={() => {
              establishmentUsersEditModal.open();
              setEditingUserRight(null);
            }}
            id={
              domElementIds.establishmentDashboard.manageEstablishments
                .addUserButton
            }
          >
            Ajouter un utilisateur
          </Button>
        </div>
      </div>

      <Feedback topics={["establishment-dashboard-users-rights"]} />

      <Table
        fixed
        id="establishment-users-table"
        headers={headers}
        data={data}
      />
      {createPortal(
        <establishmentUsersEditModal.Component
          title={
            editingUserRight
              ? "Modifier l'utilisateur"
              : "Ajouter un utilisateur"
          }
        >
          <EstablishmentUsersEditForm
            alreadyExistingUserRight={editingUserRight}
          />
        </establishmentUsersEditModal.Component>,
        document.body,
      )}
      {createPortal(
        <establishmentUsersDeleteModal.Component title="Supprimer l'utilisateur">
          <EstablishmentUsersDeleteContent
            alreadyExistingUserRight={editingUserRight}
          />
        </establishmentUsersDeleteModal.Component>,
        document.body,
      )}
    </div>
  );
};

const EstablishmentUsersDeleteContent = ({
  alreadyExistingUserRight,
}: {
  alreadyExistingUserRight: FormEstablishmentUserRight | null;
}) => {
  const dispatch = useDispatch();
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const formEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );
  const removeUserRight = (
    userRights: FormEstablishmentUserRight[],
    userRightToRemove: FormEstablishmentUserRight,
  ) =>
    userRights.filter(
      (userRight) => userRight.email !== userRightToRemove.email,
    );
  const onDeleteConfirm = () => {
    if (!alreadyExistingUserRight) return;
    const updatedFormEstablishment = {
      ...formEstablishment,
      userRights: removeUserRight(
        formEstablishment.userRights,
        alreadyExistingUserRight,
      ),
    };
    const isCurrentUserDeleted =
      alreadyExistingUserRight.email === currentUser?.email;
    dispatch(
      establishmentSlice.actions.updateEstablishmentRequested({
        establishmentUpdate: {
          formEstablishment: updatedFormEstablishment,
          jwt: connectedUserJwt ?? "",
        },
        feedbackTopic: "establishment-dashboard-users-rights",
      }),
    );
    establishmentUsersDeleteModal.close();
    if (isCurrentUserDeleted) {
      routes.establishmentDashboard().push();
      window.location.reload();
    }
  };
  return (
    <>
      <p>
        Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
        <strong>{alreadyExistingUserRight?.email}</strong> ?
      </p>
      {alreadyExistingUserRight?.email === currentUser?.email && (
        <p>
          <strong>
            Attention, vous êtes en train de supprimer votre propre compte. Si
            vous continuez, vous n'aurez plus accès à cette page.
          </strong>
        </p>
      )}
      <ButtonsGroup
        alignment="right"
        inlineLayoutWhen="always"
        buttons={[
          {
            children: "Annuler",
            priority: "secondary",
            type: "button",
            onClick: establishmentUsersDeleteModal.close,
          },
          {
            children: "Supprimer",
            priority: "primary",
            type: "button",
            onClick: onDeleteConfirm,
          },
        ]}
      />
    </>
  );
};

const EstablishmentUsersEditForm = ({
  alreadyExistingUserRight,
}: {
  alreadyExistingUserRight: FormEstablishmentUserRight | null;
}) => {
  const formEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const dispatch = useDispatch();
  const emptyValues = useRef({
    email: "",
    phone: "",
    job: "",
    role: undefined,
    shouldReceiveDiscussionNotifications: false,
    isMainContactByPhone: false,
  });
  const methods = useForm<FormEstablishmentUserRight>({
    resolver: standardSchemaResolver(formEstablishmentUserRightSchema),
    defaultValues: alreadyExistingUserRight ?? emptyValues.current,
  });

  const {
    register,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = methods;

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
    establishmentUsersEditModal.close();
  };

  useEffect(() => {
    reset(alreadyExistingUserRight ?? emptyValues.current);
  }, [alreadyExistingUserRight, reset]);

  const values = watch();
  return (
    <>
      {values.email && (
        <p>
          Pour modifier le nom, prénom ou l'email, l'utilisateur doit passer par
          son compte ProConnect créé avec l'email :{" "}
          <strong>{values.email}</strong>
        </p>
      )}
      <form>
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
        <ButtonsGroup
          alignment="right"
          inlineLayoutWhen="always"
          buttons={[
            {
              children: "Annuler",
              onClick: establishmentUsersEditModal.close,
              priority: "secondary",
              type: "button",
            },
            {
              children: "Enregistrer",
              onClick: () => onSubmit(values),
              type: "button",
            },
          ]}
        />
      </form>
    </>
  );
};

const getEstablishmentUserRow = ({
  userRight,
  isLastAdmin,
  index,
  setEditingUserRight,
}: {
  userRight: FormEstablishmentUserRight;
  isLastAdmin: boolean;
  index: number;
  setEditingUserRight: (userRight: FormEstablishmentUserRight) => void;
}) => [
  userRight.email,
  <Fragment key={`${userRight.email}-${userRight.phone}-${userRight.job}`}>
    <p className={fr.cx("fr-text--bold", "fr-text--sm")}>{userRight.job}</p>
    <p className={fr.cx("fr-text--sm")}>{userRight.phone}</p>
  </Fragment>,
  <Badge
    key={`${userRight.email}-${userRight.role}`}
    small
    className={fr.cx(userRolesToDisplay[userRight.role].className, "fr-mr-1w")}
  >
    {userRolesToDisplay[userRight.role].label}
  </Badge>,
  <NotificationIndicator
    key={`${userRight.email}-${userRight.role}`}
    isNotified={userRight.shouldReceiveDiscussionNotifications}
  />,
  <ButtonsGroup
    key={`${userRight.email}-${userRight.role}`}
    inlineLayoutWhen="always"
    buttonsSize="small"
    buttons={[
      {
        children: "Modifier",
        onClick: () => {
          setEditingUserRight(userRight);
          establishmentUsersEditModal.open();
        },
        priority: "secondary",
        className: fr.cx("fr-mb-0"),
        type: "button",
        id: `${domElementIds.establishmentDashboard.manageEstablishments.editUserButton}-${index}`,
      },
      {
        children: "Supprimer",
        onClick: () => {
          setEditingUserRight(userRight);
          establishmentUsersDeleteModal.open();
        },
        priority: "secondary",
        className: fr.cx("fr-mb-0"),
        type: "button",
        disabled: isLastAdmin,
        title: isLastAdmin
          ? "Vous devez avoir au moins un administrateur pour votre établissement."
          : undefined,
        id: `${domElementIds.establishmentDashboard.manageEstablishments.deleteUserButton}-${index}`,
      },
    ]}
  />,
];
