import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { values } from "ramda";
import { ErrorNotifications, HeadingSection } from "react-design-system";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import {
  addressDtoToString,
  domElementIds,
  type FormEstablishmentDto,
  removeAtIndex,
} from "shared";
import type {
  Mode,
  OnStepChange,
  Step,
} from "src/app/components/forms/establishment/EstablishmentForm";
import { MultipleAddressInput } from "src/app/components/forms/establishment/MultipleAddressInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  displayReadableError,
  getFormContents,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { v4 as uuidV4 } from "uuid";
import { AppellationAutocomplete } from "../../autocomplete/AppellationAutocomplete";

const addOfferModal = createModal({
  isOpenedByDefault: false,
  id: "im-add-offer-modal",
});

export const OffersSection = ({
  mode,
  onStepChange,
  currentStep,
}: {
  mode: Mode;
  onStepChange: OnStepChange;
  currentStep: Step;
}) => {
  const isStepMode = currentStep !== null;
  const methods = useFormContext<FormEstablishmentDto>();
  const {
    setValue,
    watch,
    formState: { errors },
  } = methods;
  const formValues = watch();
  const { getFormErrors, getFormFields } = getFormContents(
    formEstablishmentFieldsLabels(mode),
  );
  const formContents = getFormFields();
  const formErrors = getFormErrors();

  useIsModalOpen(addOfferModal);

  return (
    <>
      <HeadingSection
        title={formContents.appellations.label}
        description="Les métiers que vous proposez à l’immersion"
      >
        <p>
          Chaque métier correspond à une offre qui apparaitra dans la recherche.
          Votre entreprise peut donc apparaître dans différentes recherches.
        </p>
        {/* <MultipleAppellationInput
              name={formContents.appellations.name}
              id={domElementIds.establishment[mode].appellations}
              onAppellationAdd={(appellation, index) => {
                const appellationsToUpdate = formValues.appellations;
                appellationsToUpdate[index] = appellation;
                setValue("appellations", appellationsToUpdate);
              }}
              onAppellationDelete={(appellationIndex) => {
                const appellationsToUpdate = formValues.appellations;
                const newAppellations: AppellationAndRomeDto[] =
                  appellationIndex === 0 && appellationsToUpdate.length === 1
                    ? [emptyAppellationAndRome]
                    : removeAtIndex(formValues.appellations, appellationIndex);
                setValue("appellations", newAppellations);
              }}
              currentAppellations={formValues.appellations}
              error={errors?.appellations?.message}
            /> */}
        <Button
          className={fr.cx("fr-my-4v")}
          type="button"
          iconId="fr-icon-add-line"
          title="Ajouter un métier"
          id={"add-offer-button"}
          priority="secondary"
          onClick={() => {
            addOfferModal.open();
          }}
        >
          Ajouter un métier
        </Button>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <OfferCard />
          <OfferCard />
          <OfferCard />
        </div>
      </HeadingSection>
      <HeadingSection
        title={formContents.businessAddresses.label}
        description="Par défaut, vous apparaîtrez dans les résultats de recherche liés à l’adresse de votre établissement. Vous pouvez ajouter d’autres adresses si vous proposez des immersions ailleurs. Par exemple : votre société est située à Dijon (adresse liée à votre SIRET) mais vous proposez une immersion dans votre antenne de Nantes."
      >
        <MultipleAddressInput
          name="businessAddress"
          currentAddresses={formValues.businessAddresses}
          onAddressAdded={(address, index) => {
            const currentAddresses = formValues.businessAddresses;
            currentAddresses[index] = {
              id: uuidV4(),
              rawAddress: addressDtoToString(address),
            };
            setValue("businessAddresses", currentAddresses);
          }}
          onAddressDeleted={(index) => {
            const addresses = formValues.businessAddresses;
            const newAddresses =
              index === 0 && addresses.length === 1
                ? [
                    {
                      id: "",
                      rawAddress: "",
                    },
                  ]
                : removeAtIndex(addresses, index);
            setValue("businessAddresses", newAddresses);
          }}
          id={domElementIds.establishment[mode].businessAddresses}
        />
      </HeadingSection>
      {isStepMode && (
        <>
          <ErrorNotifications
            errorsWithLabels={toErrorsWithLabels({
              labels: formErrors,
              errors: displayReadableError(errors),
            })}
            visible={values(errors).length > 0}
          />

          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="left"
            buttonsEquisized
            className={fr.cx("fr-mt-4w")}
            buttons={[
              {
                children: "Étape précédente",
                iconId: "fr-icon-arrow-left-line",
                priority: "secondary",
                id: domElementIds.establishment[
                  mode
                ].previousButtonFromStepAndMode({
                  currentStep,
                  mode,
                }),
                type: "button",
                onClick: () => {
                  onStepChange(1, []);
                },
              },
              {
                children: "Étape suivante",
                onClick: () => {
                  onStepChange(3, ["appellations", "businessAddresses"]);
                },
                type: "button",
                iconId: "fr-icon-arrow-right-line",
                iconPosition: "right",
                id: domElementIds.establishment[mode].nextButtonFromStepAndMode(
                  {
                    currentStep,
                    mode,
                  },
                ),
              },
            ]}
          />
        </>
      )}
      {createPortal(
        <addOfferModal.Component
          title="Ajouter un métier"
          buttons={[
            {
              doClosesModal: true,
              children: "Annuler",
            },
            {
              doClosesModal: true,
              children: "Ajouter ce métier",
            },
          ]}
        >
          <AppellationAutocomplete
            label={"Rechercher un métier"}
            locator={"form-establishment-add-offer-modal"}
            onAppellationSelected={() => {}}
            onAppellationClear={() => {}}
            // TODO : RSAutocomplete ne supporte pas stateRelatedMessage
            stateRelatedMessage={
              <>
                Les métiers sont basés sur la{" "}
                <a
                  href="https://candidat.francetravail.fr/metierscope/metiers"
                  target="_blank"
                  rel="noreferrer"
                >
                  liste officielle de France Travail
                </a>
              </>
            }
            state="info"
          />
          <RadioButtons
            legend={"Proposez-vous du télétravail sur ce métier ?"}
            options={[
              {
                label: "Oui, télétravail hybride",
                nativeInputProps: { value: "" },
              },
              {
                label: "Oui, 100% télétravail",
                nativeInputProps: { value: "" },
              },
              {
                label: "Non, pas de télétravail",
                nativeInputProps: { value: "" },
              },
            ]}
          />
        </addOfferModal.Component>,
        document.body,
      )}
    </>
  );
};

const OfferCard = ({}: {}) => {
  return (
    <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
      <article className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w")}>
        <h1>Appelation Label</h1>
        <Badge>TELETRAVAIL HYBRIDE</Badge>
        <p>Teletravail desc</p>
        <ButtonsGroup
          buttons={[
            {
              children: "Modifier",
              iconPosition: "right",
              iconId: "fr-icon-edit-line",
              priority: "tertiary",
            },
            {
              children: "Supprimer",
              iconPosition: "right",
              iconId: "fr-icon-delete-bin-line",
              priority: "tertiary",
            },
          ]}
          inlineLayoutWhen="always"
        />
      </article>
    </div>
  );
};
