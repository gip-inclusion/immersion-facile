import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  AgencyId,
  AgencyRight,
  ExtractFromExisting,
  RejectIcUserRoleForAgencyParams,
  User,
  UserId,
  domElementIds,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import { AgencyUserModificationForm } from "src/app/components/agency/AgencyUserModificationForm";
import { UserFormMode } from "src/app/components/agency/AgencyUsers";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

type IcUserAgenciesToReviewProps = {
  agenciesNeedingReviewForUser: AgencyRight[];
  selectedUser: User;
};
type IcUserAgenciesToReviewModalProps = {
  title: string;
  mode: ExtractFromExisting<UserFormMode, "register"> | "reject";
};

function AgencyReviewForm({
  agency,
  setSelectedAgency,
  selectedUser,
  setModalProps,
}: {
  agency: AgencyDto;
  selectedUser: User;
  setSelectedAgency: (agency: AgencyDto) => void;
  setModalProps: (modalProps: IcUserAgenciesToReviewModalProps) => void;
}) {
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
                  id: `${domElementIds.admin.agencyTab.registerIcUserToAgencyButton}-${agency.id}-${selectedUser.id}`,
                  onClick: () => {
                    setModalProps({
                      title: "Rattacher cet utilisateur",
                      mode: "register",
                    });
                    setSelectedAgency(agency);
                    openIcUserRegistrationToAgencyModal();
                  },
                  children: "Valider",
                },
                {
                  type: "button",
                  priority: "secondary",
                  onClick: () => {
                    setModalProps({
                      title: "Refuser le rattachement",
                      mode: "reject",
                    });
                    setSelectedAgency(agency);
                    openIcUserRegistrationToAgencyModal();
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
  selectedUser,
}: IcUserAgenciesToReviewProps) => {
  const [selectedAgency, setSelectedAgency] = useState<AgencyDto>();
  const [modalProps, setModalProps] =
    useState<IcUserAgenciesToReviewModalProps | null>(null);

  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      {agenciesNeedingReviewForUser.map(({ agency }) => (
        <AgencyReviewForm
          key={agency.id}
          agency={agency}
          setSelectedAgency={setSelectedAgency}
          setModalProps={setModalProps}
          selectedUser={selectedUser}
        />
      ))}
      {createPortal(
        <IcUserRegistrationToAgencyModal title={modalProps?.title}>
          {selectedAgency && modalProps ? (
            modalProps.mode === "reject" ? (
              <RejectIcUserRegistrationToAgencyForm
                agency={{ id: selectedAgency.id, name: selectedAgency.name }}
                userId={selectedUser.id}
                key={`${selectedAgency.id}-${selectedUser.id}`}
              />
            ) : (
              <AgencyUserModificationForm
                agencyUser={{
                  agencyId: selectedAgency.id,
                  userId: selectedUser.id,
                  email: selectedUser.email,
                  roles: ["toReview"],
                  isIcUser: true,
                  isNotifiedByEmail: true,
                }}
                closeModal={closeIcUserRegistrationToAgencyModal}
                mode={modalProps.mode}
                agency={selectedAgency}
              />
            )
          ) : (
            "Pas d'agence sélectionnée"
          )}
        </IcUserRegistrationToAgencyModal>,
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

const {
  Component: IcUserRegistrationToAgencyModal,
  open: openIcUserRegistrationToAgencyModal,
  close: closeIcUserRegistrationToAgencyModal,
} = createModal({
  isOpenedByDefault: false,
  id: "siret",
});

type IcUserRegistrationToAgencyFormProps = {
  agency: {
    id: AgencyId;
    name: string;
  };
  userId: UserId;
};

const RejectIcUserRegistrationToAgencyForm = ({
  agency,
  userId,
}: IcUserRegistrationToAgencyFormProps) => {
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
    closeIcUserRegistrationToAgencyModal();
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
            onClick: closeIcUserRegistrationToAgencyModal,
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
