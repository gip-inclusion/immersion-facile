import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";

import type { Dispatch, SetStateAction } from "react";

import {
  type ConventionDto,
  domElementIds,
  type InternshipKind,
  isConventionRenewed,
  type Signatory,
} from "shared";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

type SignatureActionsProperties = {
  signatory: Signatory;
  jwt: string;
  internshipKind: InternshipKind;
  convention: ConventionDto;
  onCloseSignModalWithoutSignature: Dispatch<SetStateAction<boolean>>;
};

export const SignatureActions = (props: SignatureActionsProperties) => {
  const {
    signatory,
    internshipKind,
    convention,
    onCloseSignModalWithoutSignature,
  } = props;
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  // const { fieldName } = getSignatoryProcessedData(signatory);
  // const { setValue } = useFormContext();

  return (
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
          disabled={isLoading}
          // onConfirmClick={(event: MouseEvent<HTMLButtonElement>) => {
          //   setValue(fieldName, new Date().toISOString(), {
          //     shouldValidate: true,
          //   });
          //   onSubmitClick(event);
          // }}
          signatory={signatory}
          internshipKind={internshipKind}
          id={domElementIds.conventionToSign.openSignModalButton}
          onCloseSignModalWithoutSignature={onCloseSignModalWithoutSignature}
        />
      </li>

      {!isConventionRenewed(convention) && (
        <li>
          <Button
            id={domElementIds.conventionToSign.modificationButton}
            priority="secondary"
            iconId="fr-icon-edit-fill"
            iconPosition="left"
            linkProps={
              routes.conventionImmersion({
                jwt: props.jwt,
              }).link
            }
          >
            Modifier
          </Button>
        </li>
      )}
    </ul>
  );
};
