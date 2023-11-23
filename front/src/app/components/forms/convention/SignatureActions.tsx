import React, { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import {
  ConventionDto,
  ConventionStatusWithJustification,
  domElementIds,
  getSignatoryProcessedData,
  InternshipKind,
  isConventionRenewed,
  Role,
  Signatory,
  UpdateConventionStatusRequestDto,
} from "shared";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { JustificationModalContent } from "./JustificationModalContent";

type SignatureActionsProperties = {
  signatory: Signatory;
  internshipKind: InternshipKind;
  onSubmitClick: React.MouseEventHandler<HTMLButtonElement>;
  onModificationRequired: (params: UpdateConventionStatusRequestDto) => void;
  convention: ConventionDto;
  newStatus: ConventionStatusWithJustification;
  currentSignatoryRole: Role;
  onCloseSignModalWithoutSignature: Dispatch<SetStateAction<boolean>>;
};

const {
  Component: RequestModificationModal,
  open: openRequestModificationModal,
  close: closeRequestModificationModal,
} = createModal({
  isOpenedByDefault: false,
  id: "requestModification",
});

export const SignatureActions = ({
  onModificationRequired,
  onSubmitClick,
  signatory,
  internshipKind,
  convention,
  newStatus,
  currentSignatoryRole,
  onCloseSignModalWithoutSignature,
}: SignatureActionsProperties) => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const { fieldName } = getSignatoryProcessedData(signatory);
  const { setValue } = useFormContext();

  return (
    <>
      <ul
        className={fr.cx(
          "fr-btns-group",
          "fr-btns-group--center",
          "fr-btns-group--equisized",
          "fr-btns-group--icon-left",
        )}
      >
        <li>
          <SignButton
            disabled={isLoading || submitFeedback.kind !== "idle"}
            onConfirmClick={(event) => {
              setValue(fieldName, new Date().toISOString(), {
                shouldValidate: true,
              });
              onSubmitClick(event);
            }}
            signatory={signatory}
            internshipKind={internshipKind}
            id={domElementIds.conventionToSign.openSignModalButton}
            submitButtonId={domElementIds.conventionToSign.submitButton}
            onCloseSignModalWithoutSignature={onCloseSignModalWithoutSignature}
          />
        </li>

        {!isConventionRenewed(convention) && (
          <li>
            <Button
              priority="secondary"
              disabled={isLoading || submitFeedback.kind !== "idle"}
              onClick={openRequestModificationModal}
              type="button"
              iconId="fr-icon-edit-fill"
              iconPosition="left"
              nativeButtonProps={{
                id: domElementIds.conventionToSign
                  .openRequestModificationModalButton,
              }}
            >
              Annuler les signatures et demander une modification
            </Button>
          </li>
        )}
      </ul>

      {createPortal(
        <RequestModificationModal title="Demande de modification">
          <JustificationModalContent
            onSubmit={onModificationRequired}
            closeModal={closeRequestModificationModal}
            newStatus={newStatus}
            convention={convention}
            currentSignatoryRole={currentSignatoryRole}
          />
        </RequestModificationModal>,
        document.body,
      )}
    </>
  );
};
