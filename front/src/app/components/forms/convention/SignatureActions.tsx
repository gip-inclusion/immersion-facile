import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { type ModalProps, createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import {
  type Dispatch,
  Fragment,
  type MouseEvent,
  type MouseEventHandler,
  type SetStateAction,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";

import {
  type ConventionDto,
  type ConventionStatusWithJustification,
  type InternshipKind,
  type Role,
  type Signatory,
  type UpdateConventionStatusRequestDto,
  domElementIds,
  getSignatoryProcessedData,
  isConventionRenewed,
} from "shared";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { JustificationModalContent } from "./JustificationModalContent";

type SignatureActionsProperties = {
  signatory: Signatory;
  internshipKind: InternshipKind;
  onSubmitClick: MouseEventHandler<HTMLButtonElement>;
  onModificationRequired: (params: UpdateConventionStatusRequestDto) => void;
  convention: ConventionDto;
  newStatus: ConventionStatusWithJustification;
  currentSignatoryRole: Role;
  onCloseSignModalWithoutSignature: Dispatch<SetStateAction<boolean>>;
};

const requestModificationModalParams = {
  isOpenedByDefault: false,
  id: "requestModification",
};

const {
  Component: RequestModificationModal,
  open: openRequestModificationModal,
  close: closeRequestModificationModal,
} = createModal(requestModificationModalParams);

export const SignatureActions = (props: SignatureActionsProperties) => {
  const {
    onModificationRequired,
    onSubmitClick,
    signatory,
    internshipKind,
    convention,
    newStatus,
    currentSignatoryRole,
    onCloseSignModalWithoutSignature,
  } = props;
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const { fieldName } = getSignatoryProcessedData(signatory);
  const { setValue } = useFormContext();
  const t = useConventionTexts(internshipKind);
  const [modalProps, setModalProps] = useState<ModalProps>({
    title: t.verification.modifyConventionTitle,
    children: null,
  });
  const isModalOpen = useIsModalOpen(requestModificationModalParams);

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
            onConfirmClick={(event: MouseEvent<HTMLButtonElement>) => {
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
        <RequestModificationModal title={modalProps.title}>
          <Fragment key={`${requestModificationModalParams.id}-${isModalOpen}`}>
            <JustificationModalContent
              onSubmit={onModificationRequired}
              closeModal={closeRequestModificationModal}
              newStatus={newStatus}
              convention={convention}
              currentSignatoryRoles={[currentSignatoryRole]}
              onModalPropsChange={(newProps) => {
                setModalProps({
                  ...modalProps,
                  ...newProps,
                });
              }}
            />
          </Fragment>
        </RequestModificationModal>,
        document.body,
      )}
    </>
  );
};
