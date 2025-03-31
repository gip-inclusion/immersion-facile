import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { zodResolver } from "@hookform/resolvers/zod";
import { uniqBy } from "ramda";
import { Fragment, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type FormEstablishmentUserRight,
  domElementIds,
  establishmentFormUserRightSchema,
  establishmentsRoles,
} from "shared";
import { UsersWithoutNameHint } from "src/app/components/agency/UsersWithoutNameHint";
import { Feedback } from "src/app/components/feedback/Feedback";
import { userRoleToDisplay } from "src/app/contents/userRoleToDisplay";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
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

  useIsModalOpen(establishmentUsersEditModal, {
    onConceal: () => {
      setEditingUserRight(null);
    },
  });
  useIsModalOpen(establishmentUsersDeleteModal, {
    onConceal: () => {
      setEditingUserRight(null);
    },
  });

  if (!formEstablishment?.userRights) return null;

  const headers = ["Utilisateur", "Informations de contact", "Rôle", "Actions"];

  const data = formEstablishment.userRights.map((userRight) => [
    userRight.email,
    <Fragment key={`${userRight.email}-${userRight.phone}-${userRight.job}`}>
      <p className={fr.cx("fr-text--bold", "fr-text--sm")}>{userRight.job}</p>
      <p className={fr.cx("fr-text--sm")}>{userRight.phone}</p>
    </Fragment>,
    <Badge
      key={`${userRight.email}-${userRight.role}`}
      small
      className={fr.cx(userRoleToDisplay[userRight.role].className, "fr-mr-1w")}
    >
      {userRoleToDisplay[userRight.role].label}
    </Badge>,
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
        },
      ]}
    />,
  ]);
  return (
    <div className="fr-mt-4w">
      <div className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
        <div>
          <h2>Utilisateurs</h2>
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

      <Feedback topic={"establishment-dashboard-users-rights"} />

      <Table
        fixed
        id="establishment-users-table"
        headers={headers}
        data={data}
      />
      <establishmentUsersEditModal.Component
        title={
          editingUserRight ? "Modifier l'utilisateur" : "Ajouter un utilisateur"
        }
      >
        <EstablishmentUsersEditForm
          alreadyExistingUserRight={editingUserRight}
        />
      </establishmentUsersEditModal.Component>
      <establishmentUsersDeleteModal.Component title="Supprimer l'utilisateur">
        <EstablishmentUsersDeleteContent
          alreadyExistingUserRight={editingUserRight}
        />
      </establishmentUsersDeleteModal.Component>
    </div>
  );
};

const EstablishmentUsersDeleteContent = ({
  alreadyExistingUserRight,
}: {
  alreadyExistingUserRight: FormEstablishmentUserRight | null;
}) => {
  const dispatch = useDispatch();
  const token = useAppSelector(authSelectors.inclusionConnectToken);
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
    dispatch(
      establishmentSlice.actions.updateEstablishmentRequested({
        establishmentUpdate: {
          formEstablishment: updatedFormEstablishment,
          jwt: token ?? "",
        },
        feedbackTopic: "establishment-dashboard-users-rights",
      }),
    );
    establishmentUsersDeleteModal.close();
  };
  return (
    <>
      <p>
        Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
        <strong>{alreadyExistingUserRight?.email}</strong> ?
      </p>
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
  const token = useAppSelector(authSelectors.inclusionConnectToken);
  const dispatch = useDispatch();
  const emptyValues = useRef({
    email: "",
    phone: "",
    job: "",
    role: undefined,
  });
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<FormEstablishmentUserRight>({
      resolver: zodResolver(establishmentFormUserRightSchema),
      defaultValues: alreadyExistingUserRight ?? emptyValues.current,
    });

  const mergeUserRights = (
    userRights: FormEstablishmentUserRight[],
    userRightToMerge: FormEstablishmentUserRight,
  ) =>
    uniqBy((userRight) => userRight.email, [userRightToMerge, ...userRights]);

  const onSubmit = (data: FormEstablishmentUserRight) => {
    const updatedFormEstablishment = {
      ...formEstablishment,
      userRights: mergeUserRights(formEstablishment.userRights, data),
    };
    dispatch(
      establishmentSlice.actions.updateEstablishmentRequested({
        establishmentUpdate: {
          formEstablishment: updatedFormEstablishment,
          jwt: token ?? "",
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
          Pour modifier le nom, prénom ou l’email, l'utilisateur doit passer par
          son compte ProConnect créé avec l'email :{" "}
          <strong>{values.email}</strong>
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit, console.log)}>
        {!alreadyExistingUserRight?.email && (
          <Input
            label="Email"
            nativeInputProps={{
              ...register("email"),
            }}
          />
        )}
        <Input
          label="Téléphone"
          nativeInputProps={{
            ...register("phone"),
          }}
        />
        <Input
          label="Fonction"
          nativeInputProps={{
            ...register("job"),
          }}
        />
        <RadioButtons
          legend="Rôle"
          options={establishmentsRoles.map((role) => ({
            label: userRoleToDisplay[role].label,
            hintText: userRoleToDisplay[role].description,
            nativeInputProps: {
              checked: values.role === role,
              value: role,
              onChange: () => {
                setValue("role", role);
              },
            },
          }))}
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
              onClick: handleSubmit(onSubmit),
              type: "submit",
            },
          ]}
        />
      </form>
    </>
  );
};
