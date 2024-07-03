import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  AgencyId,
  AgencyRight,
  AgencyRole,
  RejectIcUserRoleForAgencyParams,
  UserId,
  domElementIds,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

type SelectableAgencyRole = (typeof selectableAgencyRoles)[number];
const selectableAgencyRoles = [
  "counsellor",
  "validator",
] satisfies AgencyRole[];

type IcUserAgenciesToReviewProps = {
  agenciesNeedingReviewForUser: AgencyRight[];
  selectedUserId: UserId;
};

function AgencyReviewForm({
  agency,
  setSelectedAgency,
  selectedUserId,
}: {
  agency: AgencyDto;
  selectedUserId: UserId;
  setSelectedAgency: (agency: AgencyDto) => void;
}) {
  const dispatch = useDispatch();
  const agencyHasNoCounsellors = agency.counsellorEmails.length === 0;
  const agencyRefersToOtherAgency = !!agency.refersToAgencyId;

  const getDefaultRole = (): SelectableAgencyRole | undefined => {
    if (agencyRefersToOtherAgency) return "counsellor";
    if (agencyHasNoCounsellors) return "validator";
    return undefined;
  };

  const [selectedRole, setSelectedRole] = useState<
    SelectableAgencyRole | undefined
  >(getDefaultRole());

  const registerIcUserToAgency = (agency: AgencyDto) => {
    if (!selectedRole) throw new Error("please select a role");

    dispatch(
      icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested({
        agencyId: agency.id,
        userId: selectedUserId,
        roles: [selectedRole],
      }),
    );
  };

  return (
    <div className={fr.cx("fr-col-4")}>
      <div className={fr.cx("fr-card")}>
        <div className={fr.cx("fr-card__body")}>
          <div className={fr.cx("fr-card__content")}>
            <h3 className={fr.cx("fr-card__title")}>{agency.name}</h3>
            <p className={fr.cx("fr-card__desc")}>
              {agency.address.streetNumberAndAddress} {agency.address.postcode}{" "}
              {agency.address.city}
            </p>
            <p className={fr.cx("fr-card__desc")}>
              <DisplayEmailList
                emailKind={"conseillers"}
                emails={agency.counsellorEmails}
              />
              <DisplayEmailList
                emailKind={"validateurs"}
                emails={agency.validatorEmails}
              />
            </p>
            <div className={fr.cx("fr-card__desc")}>
              <Select
                label="Sélectionner un rôle"
                disabled={agencyHasNoCounsellors || agencyRefersToOtherAgency}
                options={[
                  ...selectableAgencyRoles.map((role) => ({
                    value: role,
                    label: labelByRole[role],
                  })),
                ]}
                nativeSelectProps={{
                  value: selectedRole,
                  onChange: (event) => {
                    setSelectedRole(
                      event.currentTarget.value as SelectableAgencyRole,
                    );
                  },
                }}
              />
            </div>
          </div>
          <div className={fr.cx("fr-card__footer")}>
            <ButtonsGroup
              alignment="center"
              inlineLayoutWhen="always"
              buttonsSize="small"
              buttons={[
                {
                  type: "button",
                  priority: "primary",
                  id: `${domElementIds.admin.agencyTab.registerIcUserToAgencyButton}-${agency.id}-${selectedUserId}`,
                  onClick: () => registerIcUserToAgency(agency),
                  children: "Valider",
                  disabled: !selectedRole,
                },
                {
                  type: "button",
                  priority: "secondary",
                  onClick: () => {
                    setSelectedAgency(agency);
                    openRejectIcUserRegistrationToAgencyModal();
                  },
                  children: "Refuser",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const IcUserAgenciesToReview = ({
  agenciesNeedingReviewForUser,
  selectedUserId,
}: IcUserAgenciesToReviewProps) => {
  const [selectedAgency, setSelectedAgency] = useState<AgencyDto>();

  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      {agenciesNeedingReviewForUser.map(({ agency }) => (
        <AgencyReviewForm
          key={agency.id}
          agency={agency}
          setSelectedAgency={setSelectedAgency}
          selectedUserId={selectedUserId}
        />
      ))}
      {createPortal(
        <RejectIcUserRegistrationToAgencyModal title="Refuser le rattachement">
          {selectedAgency ? (
            <RejectIcUserRegistrationToAgencyForm
              agency={{ id: selectedAgency.id, name: selectedAgency.name }}
              userId={selectedUserId}
              key={`${selectedAgency.id}-${selectedUserId}`}
            />
          ) : (
            "Pas d'agence sélectionnée"
          )}
        </RejectIcUserRegistrationToAgencyModal>,
        document.body,
      )}
    </div>
  );
};

const DisplayEmailList = ({
  emails,
  emailKind,
}: {
  emailKind: string;
  emails: string[];
}) => {
  if (emails.length === 0) return null;

  return (
    <ul>
      <strong>Email {emailKind} :</strong>
      {emails.map((email) => (
        <li key={email}>{email}</li>
      ))}
    </ul>
  );
};

const labelByRole: Record<AgencyRole, string> = {
  counsellor: "Conseiller",
  validator: "Validateur",
  agencyOwner: "Administrateur d'agence",
  toReview: "À valider",
  "agency-viewer": "Lecteur",
};

const {
  Component: RejectIcUserRegistrationToAgencyModal,
  open: openRejectIcUserRegistrationToAgencyModal,
  close: closeRejectIcUserRegistrationToAgencyModal,
} = createModal({
  isOpenedByDefault: false,
  id: "siret",
});

type RejectIcUserRegistrationToAgencyFormProps = {
  agency: {
    id: AgencyId;
    name: string;
  };
  userId: UserId;
};

const RejectIcUserRegistrationToAgencyForm = ({
  agency,
  userId,
}: RejectIcUserRegistrationToAgencyFormProps) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, formState } =
    useForm<RejectIcUserRoleForAgencyParams>({
      resolver: zodResolver(rejectIcUserRoleForAgencyParamsSchema),
      mode: "onTouched",
      defaultValues: {
        agencyId: agency.id,
        userId,
        justification: "",
      },
    });

  const getFieldError = makeFieldError(formState);

  const onFormSubmit: SubmitHandler<RejectIcUserRoleForAgencyParams> = (
    values,
  ) => {
    dispatch(
      icUsersAdminSlice.actions.rejectAgencyWithRoleToUserRequested(values),
    );
    closeRejectIcUserRegistrationToAgencyModal();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Input
        label={`Motif de refus de rattachement à l'agence ${agency.name}`}
        nativeInputProps={register("justification")}
        {...getFieldError("justification")}
      />
      <ButtonsGroup
        alignment="center"
        inlineLayoutWhen="always"
        buttons={[
          {
            type: "button",
            priority: "secondary",
            onClick: closeRejectIcUserRegistrationToAgencyModal,
            children: "Annuler",
          },
          {
            type: "submit",
            children: "Refuser le rattachement",
          },
        ]}
      />
    </form>
  );
};
