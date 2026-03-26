import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import Input from "@codegouvfr/react-dsfr/Input";
import {
  type ChangeEvent,
  type ElementRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader, useDebounce } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  type ConnectedUser,
  domElementIds,
  looksLikeSiret,
  type SiretDto,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { EstablishmentUserForm } from "src/app/pages/establishment-dashboard/EstablishmentUserForm";
import { createFormModal } from "src/app/utils/createFormModal";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";

const establishmentRegisterEstablishmentModal = createFormModal({
  id: "establishment-register-establishment-modal",
  isOpenedByDefault: false,
  formId: "establishment-register-establishment-form",
  doSubmitClosesModal: false,
});

export const RegisterEstablishmentsForm = ({
  currentUser,
}: {
  currentUser: ConnectedUser;
}) => {
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const isLoading = useAppSelector(establishmentSelectors.isLoading);
  const establishmentPublicOptions = useAppSelector(
    establishmentSelectors.establishmentPublicOptions,
  );
  const establishmentPublicOptionsToDisplay = useMemo(
    () =>
      establishmentPublicOptions.filter(
        (establishmentPublicOption) =>
          !establishmentPublicOption.userRightIds.includes(currentUser.id),
      ),
    [establishmentPublicOptions, currentUser.id],
  );

  const establishmentSearchBySiretOrNameInput =
    useRef<ElementRef<"input">>(null);
  const debouncedInputValue = useDebounce(inputValue, 500);

  const [selectedEstablishmentSiret, setSelectedEstablishmentSiret] = useState<
    SiretDto | undefined
  >(undefined);

  const onEstablishmentSearchChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setInputValue(event.currentTarget.value);
    setSelectedEstablishmentSiret(undefined);
  };

  if (inputValue === undefined && currentUser.proConnect) {
    setInputValue(currentUser.proConnect.siret);
  }

  useEffect(() => {
    if (!connectedUserJwt || !debouncedInputValue) return;
    dispatch(
      establishmentSlice.actions.fetchEstablishmentPublicOptionsRequested({
        filters: {
          [looksLikeSiret(debouncedInputValue) ? "siret" : "nameIncludes"]:
            debouncedInputValue,
        },
        jwt: connectedUserJwt,
        feedbackTopic: "my-profile-establishment-registration",
      }),
    );
  }, [debouncedInputValue, connectedUserJwt, dispatch]);

  return (
    <>
      {isLoading && <Loader />}
      <div className={fr.cx("fr-mb-2w")}>
        <Input
          label="Se rattacher à une entreprise"
          hintText="Rechercher par n° SIRET ou nom sous lequel il est enregistré sur Immersion Facilitée"
          nativeInputProps={{
            id: domElementIds.profile.registerEstablishment.search,
            type: "search",
            placeholder: "",
            value: inputValue,
            onChange: onEstablishmentSearchChange,
            onKeyDown: (event) => {
              if (event.key === "Escape") {
                establishmentSearchBySiretOrNameInput.current?.blur();
              }
            },
          }}
        />
      </div>
      <a
        href="https://annuaire-entreprises.data.gouv.fr/"
        target="_blank"
        rel="noreferrer"
        className={fr.cx("fr-link")}
      >
        <i className={fr.cx("fr-icon-information-fill", "fr-icon--sm")} />
        Retrouver votre siret sur l'Annuaire des Entreprises
      </a>
      {inputValue && (
        <div className={fr.cx("fr-mt-4w")}>
          <strong>Résultats pour votre recherche "{inputValue}"</strong>
          <p className={fr.cx("fr-hint-text")}>
            {establishmentPublicOptionsToDisplay.length}{" "}
            {establishmentPublicOptionsToDisplay.length <= 1
              ? "entreprise trouvée"
              : "entreprises trouvées"}
          </p>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {establishmentPublicOptionsToDisplay.map(
              (establishmentPublicOption) => (
                <div
                  className={fr.cx("fr-col-12", "fr-col-md-4")}
                  key={establishmentPublicOption.siret}
                >
                  <Card
                    title={
                      establishmentPublicOption.businessNameCustomized
                        ? establishmentPublicOption.businessNameCustomized
                        : establishmentPublicOption.businessName
                    }
                    desc={establishmentPublicOption.siret}
                    endDetail={
                      <Button
                        onClick={() => {
                          setSelectedEstablishmentSiret(
                            establishmentPublicOption.siret,
                          );
                          establishmentRegisterEstablishmentModal.open();
                        }}
                        size="small"
                      >
                        Demander le rattachement
                      </Button>
                    }
                  />
                </div>
              ),
            )}
          </div>
          {createPortal(
            <establishmentRegisterEstablishmentModal.Component
              title={"Demander le rattachement"}
            >
              <EstablishmentUserForm
                alreadyExistingUserRight={{
                  email: currentUser.email,
                  status: "PENDING",
                }}
                selectedEstablishmentSiret={selectedEstablishmentSiret}
                establishmentUsersEditModal={
                  establishmentRegisterEstablishmentModal
                }
              />
            </establishmentRegisterEstablishmentModal.Component>,
            document.body,
          )}
        </div>
      )}
    </>
  );
};
