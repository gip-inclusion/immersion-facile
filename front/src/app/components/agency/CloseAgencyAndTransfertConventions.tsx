import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import type { AgencyDto } from "shared";
import {
  type CloseAgencyAndTransfertConventionsRequestDto,
  closeAgencyAndTransfertConventionsRequestSchema,
  domElementIds,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import "src/assets/admin.css";
import { createFormModal, useFormModal } from "src/app/utils/createFormModal";
import { closeAgencyAndTransfertConventionsSlice } from "src/core-logic/domain/agencies/close-agency-and-transfert-conventions/closeAgencyAndTransfertConventions.slice";

const createTransferConventionsModalParams = {
  id: domElementIds.admin.agencyTab.closeAgencyAndTransfertConventionsModal,
  isOpenedByDefault: false,
  formId: domElementIds.admin.agencyTab.closeAgencyAndTransfertConventionsForm,
  submitButton: {
    id: domElementIds.admin.agencyTab
      .closeAgencyAndTransfertConventionsSubmitButton,
    children: "Confirmer le transfert",
  },
  cancelButton: {
    id: domElementIds.admin.agencyTab
      .closeAgencyAndTransfertConventionsCancelButton,
  },
  doSubmitClosesModal: false,
};

const {
  Component: TransferConventionsModal,
  open: openTransferConventionsModal,
  close: closeTransferConventionsModal,
} = createFormModal(createTransferConventionsModalParams);

type CloseAgencyAndTransfertConventionsProps = {
  agency: AgencyDto;
};

const CloseAgencyAndTransfertConventionsModalContent = ({
  agency,
  onSubmit,
}: {
  agency: AgencyDto;
  onSubmit: (payload: CloseAgencyAndTransfertConventionsRequestDto) => void;
}) => {
  const { formId } = useFormModal();
  const methods = useForm<CloseAgencyAndTransfertConventionsRequestDto>({
    resolver: zodResolver(closeAgencyAndTransfertConventionsRequestSchema),
    mode: "onTouched",
    defaultValues: {
      agencyToCloseId: agency.id,
      agencyToTransferConventionsToId: "",
    },
  });
  const { register, handleSubmit, formState } = methods;
  const getFieldError = makeFieldError(formState);

  const onFormSubmit = (
    values: CloseAgencyAndTransfertConventionsRequestDto,
  ) => {
    onSubmit(values);
    closeTransferConventionsModal();
  };

  return (
    <>
      <p className={fr.cx("fr-mb-4w")}>
        Vous êtes sur le point de transférer les conventions de l'agence{" "}
        <strong>{agency.name}</strong> vers une autre agence.
      </p>
      <p>
        Si ça n'est pas déjà le cas, une fois les conventions transférées cette
        agence passera au statut "Fermée".
      </p>
      <form onSubmit={handleSubmit(onFormSubmit)} id={formId}>
        <Input
          label="Id de l'agence vers laquelle transférer les conventions"
          nativeInputProps={{
            id: domElementIds.admin.agencyTab
              .closeAgencyAndTransfertConventionsTargetAgencyIdInput,
            ...register("agencyToTransferConventionsToId"),
          }}
          {...getFieldError("agencyToTransferConventionsToId")}
        />
      </form>
    </>
  );
};

export const CloseAgencyAndTransfertConventions = ({
  agency,
}: CloseAgencyAndTransfertConventionsProps) => {
  const dispatch = useDispatch();

  const onSubmit = (payload: CloseAgencyAndTransfertConventionsRequestDto) => {
    dispatch(
      closeAgencyAndTransfertConventionsSlice.actions.closeAgencyAndTransfertConventionsRequested(
        { ...payload, feedbackTopic: "close-agency-and-transfert-conventions" },
      ),
    );
  };

  return (
    <>
      <Button
        id={
          domElementIds.admin.agencyTab.closeAgencyAndTransfertConventionsButton
        }
        priority="secondary"
        type="button"
        onClick={() => openTransferConventionsModal()}
      >
        Transférer les conventions
      </Button>
      {createPortal(
        <TransferConventionsModal title="Transférer les conventions">
          <CloseAgencyAndTransfertConventionsModalContent
            agency={agency}
            onSubmit={onSubmit}
          />
        </TransferConventionsModal>,
        document.body,
      )}
    </>
  );
};
