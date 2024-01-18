import React from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AgencyId,
  domElementIds,
  UpdateAgencyStatusParams,
  withAgencyIdSchema,
  zTrimmedString,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { useAppSelector } from "../../hooks/reduxHooks";
import { AgencyDetails } from "../admin/AgencyDetails";
import "src/assets/admin.css";

type RejectionJustificationForm = { rejectionJustification: string };
type ManageAgencyToReviewAdminForm = {
  agencyId: AgencyId;
};

const rejectAgencyModal = createModal({
  id: domElementIds.admin.agencyTab.rejectAgencyModal,
  isOpenedByDefault: false,
});

const RejectAgencyModalContent = ({
  onReject,
}: {
  onReject: (rejectionJustification: RejectionJustificationForm) => void;
}) => {
  const methods = useForm<RejectionJustificationForm>({
    mode: "onTouched",
    defaultValues: {
      rejectionJustification: undefined,
    },
    resolver: zodResolver(z.object({ rejectionJustification: zTrimmedString })),
  });
  const { register, handleSubmit, formState, getValues } = methods;

  const onSubmit = () => {
    onReject(getValues());
    rejectAgencyModal.close();
  };

  return (
    <rejectAgencyModal.Component title="Rejeter cette agence">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          textArea
          label="Justification"
          nativeTextAreaProps={{
            id: "admin-agency-to-review-rejection-justification",
            ...register("rejectionJustification"),
          }}
        />
        <ButtonsGroup
          className={fr.cx("fr-mt-4w")}
          buttonsEquisized
          alignment="center"
          inlineLayoutWhen="always"
          buttons={[
            {
              iconId: "fr-icon-alert-fill",
              children: "Annuler",
              priority: "secondary",
              onClick: () => rejectAgencyModal.close(),
            },
            {
              id: "admin-agency-to-review-reject-confirm-button",
              iconId: "fr-icon-checkbox-fill",
              children: "Rejeter cette agence",
              priority: "primary",
              type: "submit",
              disabled: !formState.isValid,
            },
          ]}
        />
      </form>
    </rejectAgencyModal.Component>
  );
};

const useFetchAgenciesNeedingReview = () => {
  const { agencyNeedingReview } = useAppSelector(
    agencyAdminSelectors.agencyState,
  );

  return {
    agencyNeedingReview,
  };
};

export const ActivateAgency = () => {
  const { agencyNeedingReview } = useFetchAgenciesNeedingReview();

  const dispatch = useDispatch();

  const methods = useForm<ManageAgencyToReviewAdminForm>({
    mode: "onTouched",
    defaultValues: {
      agencyId: undefined,
    },
    resolver: zodResolver(withAgencyIdSchema),
  });
  const { register, handleSubmit, formState, reset } = methods;

  const getFieldError = makeFieldError(formState);

  const updateAgencyStatus = (
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ) => {
    if (!agencyNeedingReview) return;
    dispatch(
      agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested(
        updateAgencyStatusParams,
      ),
    );
    dispatch(agencyAdminSlice.actions.setAgencyNeedingReview(null));
    reset();
  };

  const setSelectedAgencyNeedingReviewId = (values: {
    agencyId: AgencyId | undefined;
  }) => {
    if (!values.agencyId) return;
    dispatch(
      agencyAdminSlice.actions.setSelectedAgencyNeedingReviewId(
        values.agencyId,
      ),
    );
  };

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w", "fr-mt-4w")}>
        Activer ou Rejeter une agence
      </h5>
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <form onSubmit={handleSubmit(setSelectedAgencyNeedingReviewId)}>
          <Input
            label="Id de l'agence *"
            nativeInputProps={{
              id: "admin-agency-to-review-id",
              ...register("agencyId"),
            }}
            {...getFieldError("agencyId")}
          />
          <Button
            id="admin-agency-to-review-submit"
            type="submit"
            title="Examiner cette agence"
            disabled={!formState.isValid}
          >
            Examiner cette agence
          </Button>
        </form>

        <AgencyDetails />
        {agencyNeedingReview?.id &&
          agencyNeedingReview.status === "needsReview" && (
            <ButtonsGroup
              className={fr.cx("fr-mt-4w")}
              buttonsEquisized
              alignment="center"
              inlineLayoutWhen="always"
              buttons={[
                {
                  id: "admin-agency-to-review-activate-button",
                  iconId: "fr-icon-checkbox-fill",
                  children: "Activer cette agence",
                  priority: "primary",
                  onClick: () =>
                    updateAgencyStatus({
                      id: agencyNeedingReview.id,
                      status: "active",
                    }),
                },
                {
                  id: "admin-agency-to-review-reject-button",
                  iconId: "fr-icon-alert-fill",
                  children: "Rejeter cette agence",
                  priority: "secondary",
                  onClick: () => rejectAgencyModal.open(),
                },
              ]}
            />
          )}
      </div>
      {agencyNeedingReview?.id &&
        createPortal(
          <RejectAgencyModalContent
            onReject={({ rejectionJustification }) =>
              updateAgencyStatus({
                id: agencyNeedingReview.id,
                status: "rejected",
                rejectionJustification,
              })
            }
          />,
          document.body,
        )}
    </>
  );
};
