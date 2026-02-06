import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";

import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import type { AgencyId, UpdateAgencyStatusParams, WithAgencyId } from "shared";
import { domElementIds, withAgencyIdSchema, zStringMinLength1 } from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { createFormModal } from "src/app/utils/createFormModal";
import "src/assets/admin.css";

import { agencyNeedingReviewSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agency-needing-review/agencyNeedingReview.selectors";
import { agencyNeedingReviewSlice } from "src/core-logic/domain/admin/agenciesAdmin/agency-needing-review/agencyNeedingReview.slice";
import { z } from "zod";
import { useAppSelector } from "../../hooks/reduxHooks";
import { AgencyDetails } from "../admin/AgencyDetails";
import { BackofficeDashboardTabContent } from "../layout/BackofficeDashboardTabContent";

const createRejectAgencyModalParams = {
  id: domElementIds.admin.agencyTab.rejectAgencyModal,
  isOpenedByDefault: false,
  formId: domElementIds.admin.agencyTab.rejectAgencyModalForm,
  submitButton: {
    id: domElementIds.admin.agencyTab.rejectAgencyModalSubmitButton,
    children: "Rejeter cette agence",
  },
  cancelButton: {
    id: domElementIds.admin.agencyTab.rejectAgencyModalCancelButton,
  },
  doSubmitClosesModal: false,
};
const {
  Component: RejectAgencyModal,
  open: openRejectAgencyModal,
  close: closeRejectAgencyModal,
} = createFormModal(createRejectAgencyModalParams);

export const ActivateAgency = () => {
  const dispatch = useDispatch();

  const agencyNeedingReview = useAppSelector(
    agencyNeedingReviewSelectors.agencyNeedingReview,
  );

  const methods = useForm<WithAgencyId>({
    mode: "onTouched",
    defaultValues: {
      agencyId: undefined,
    },
    resolver: zodResolver(withAgencyIdSchema),
  });

  const { register, handleSubmit, formState, reset } = methods;

  const getFieldError = makeFieldError(formState);

  const updateAgencyNeedingReviewStatus = (
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ) => {
    if (!agencyNeedingReview) return;
    dispatch(
      agencyNeedingReviewSlice.actions.updateAgencyNeedingReviewStatusRequested(
        {
          ...updateAgencyStatusParams,
          feedbackTopic: "agency-admin-needing-review",
        },
      ),
    );
    dispatch(agencyNeedingReviewSlice.actions.clearAgencyNeedingReview());
    reset();
  };

  const fetchAgencyNeedingReview = (values: {
    agencyId: AgencyId | undefined;
  }) => {
    if (!values.agencyId) return;
    dispatch(
      agencyNeedingReviewSlice.actions.fetchAgencyNeedingReviewRequested({
        agencyId: values.agencyId,
        feedbackTopic: "agency-admin-needing-review",
      }),
    );
  };

  return (
    <BackofficeDashboardTabContent
      title="Activer ou Rejeter une agence"
      className={fr.cx("fr-mt-4w")}
    >
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <form onSubmit={handleSubmit(fetchAgencyNeedingReview)}>
          <Input
            label="Id de l'agence *"
            nativeInputProps={{
              id: domElementIds.admin.agencyTab.agencyToReviewInput,
              ...register("agencyId"),
            }}
            {...getFieldError("agencyId")}
          />
          <Button
            id={domElementIds.admin.agencyTab.agencyToReviewButton}
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
                  id: domElementIds.admin.agencyTab
                    .agencyToReviewActivateButton,
                  iconId: "fr-icon-checkbox-fill",
                  children: "Activer cette agence",
                  priority: "primary",
                  onClick: () =>
                    updateAgencyNeedingReviewStatus({
                      id: agencyNeedingReview.id,
                      status: "active",
                    }),
                },
                {
                  id: domElementIds.admin.agencyTab.agencyToReviewRejectButton,
                  iconId: "fr-icon-alert-fill",
                  children: "Rejeter cette agence",
                  priority: "secondary",
                  onClick: () => openRejectAgencyModal(),
                },
              ]}
            />
          )}
      </div>
      {agencyNeedingReview?.id &&
        createPortal(
          <RejectAgencyModal title="Rejeter cette agence">
            <RejectAgencyModalContent
              onReject={({ statusJustification }) =>
                updateAgencyNeedingReviewStatus({
                  id: agencyNeedingReview.id,
                  status: "rejected",
                  statusJustification,
                })
              }
              onClose={closeRejectAgencyModal}
            />
          </RejectAgencyModal>,
          document.body,
        )}
    </BackofficeDashboardTabContent>
  );
};

type RejectAgencyModalFormDto = { statusJustification: string };

const RejectAgencyModalContent = ({
  onReject,
  onClose,
}: {
  onReject: (values: RejectAgencyModalFormDto) => void;
  onClose: () => void;
}) => {
  const methods = useForm<RejectAgencyModalFormDto>({
    mode: "onTouched",
    defaultValues: {
      statusJustification: undefined,
    },
    resolver: zodResolver(z.object({ statusJustification: zStringMinLength1 })),
  });
  const { register, handleSubmit } = methods;

  const onSubmit = (values: RejectAgencyModalFormDto) => {
    onReject(values);
    onClose();
  };

  const formId = domElementIds.admin.agencyTab.rejectAgencyModalForm;

  return (
    <form onSubmit={handleSubmit(onSubmit)} id={formId}>
      <Input
        textArea
        label="Justification"
        nativeTextAreaProps={{
          id: domElementIds.admin.agencyTab.rejectAgencyModalJustificationInput,
          ...register("statusJustification"),
        }}
      />
    </form>
  );
};
