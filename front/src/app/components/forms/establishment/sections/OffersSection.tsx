import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { equals, values } from "ramda";
import { Fragment, useState } from "react";
import { ErrorNotifications, HeadingSection } from "react-design-system";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  addressDtoToString,
  domElementIds,
  type EstablishmentFormOffer,
  establishmentFormOfferSchema,
  type FormEstablishmentDto,
  type OmitFromExistingKeys,
  type RemoteWorkMode,
  remoteWorkModes,
  removeAtIndex,
  replaceAtIndex,
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
import { appellationSlice } from "src/core-logic/domain/appellation/appellation.slice";
import { v4 as uuidV4 } from "uuid";
import type { $ZodIssue } from "zod/v4/core";
import { AppellationAutocomplete } from "../../autocomplete/AppellationAutocomplete";

const offerModal = createModal({
  isOpenedByDefault: false,
  id: "im-offer-modal",
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
  const dispatch = useDispatch();
  const formContents = getFormFields();
  const formErrors = getFormErrors();
  const [selectedOfferIndex, setSelectedOfferIndex] = useState<number | null>(
    null,
  );

  return (
    <>
      <HeadingSection
        title={formContents.offers.label}
        description="Les métiers que vous proposez à l’immersion"
      >
        <p>
          Chaque métier correspond à une offre qui apparaitra dans la recherche.
          Votre entreprise peut donc apparaître dans différentes recherches.
        </p>
        <Button
          className={fr.cx("fr-my-4v")}
          type="button"
          iconId="fr-icon-add-line"
          title="Ajouter un métier"
          id={"add-offer-button"}
          priority="secondary"
          onClick={() => {
            setSelectedOfferIndex(null);
            appellationSlice.actions.clearLocatorDataRequested({
              locator: "form-establishment-offer-modal",
            });
            offerModal.open();
          }}
        >
          Ajouter un métier
        </Button>
        {formValues.offers.length > 0 && (
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {formValues.offers.map((offer, index) => (
              <OfferCard
                key={`${offer.appellationCode}-${index}`}
                index={index}
                onEditOfferClick={() => {
                  setSelectedOfferIndex(index);
                  dispatch(
                    appellationSlice.actions.selectSuggestionRequested({
                      item: {
                        appellation: {
                          appellationCode: offer.appellationCode,
                          appellationLabel: offer.appellationLabel,
                          romeCode: offer.romeCode,
                          romeLabel: offer.romeLabel,
                        },
                        matchRanges: [],
                      },
                      locator: "form-establishment-offer-modal",
                    }),
                  );
                  offerModal.open();
                }}
              />
            ))}
          </div>
        )}
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
                  onStepChange(3, ["offers", "businessAddresses"]);
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
        <OfferModal selectedOfferIndex={selectedOfferIndex} />,
        document.body,
      )}
    </>
  );
};

const OfferCard = ({
  index,
  onEditOfferClick,
}: {
  index: number;
  onEditOfferClick: () => void;
}) => {
  const { setValue, watch } = useFormContext<FormEstablishmentDto>();
  const formValues = watch();
  const { appellationLabel, remoteWorkMode } = formValues.offers[index];
  return (
    <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
      <article className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--top")}>
          <h3 className={fr.cx("fr-h6", "fr-col-lg-7", "fr-col-5", "fr-mb-0")}>
            {appellationLabel}
          </h3>
          <Badge className={fr.cx("fr-badge--purple-glycine", "fr-ml-auto")}>
            {remoteWorkModeLabels[remoteWorkMode].label}
          </Badge>
        </div>
        <p className={fr.cx("fr-mt-2w", "fr-text--sm")}>
          {remoteWorkModeLabels[remoteWorkMode].description}
        </p>
        <ButtonsGroup
          buttons={[
            {
              children: "Modifier",
              iconPosition: "right",
              iconId: "fr-icon-edit-line",
              priority: "tertiary",
              onClick: onEditOfferClick,
            },
            {
              children: "Supprimer",
              iconPosition: "right",
              iconId: "fr-icon-delete-bin-line",
              priority: "tertiary",
              onClick: () => {
                const offers = formValues.offers;
                const newOffers = removeAtIndex(offers, index);
                setValue("offers", newOffers);
              },
            },
          ]}
          className={fr.cx("fr-mt-auto")}
          inlineLayoutWhen="always"
        />
      </article>
    </div>
  );
};

const getIssueForField = <T,>(issues: $ZodIssue[], field: keyof T) => {
  return issues.find((issue) => issue.path.join(".") === field);
};

const getIssueForAppellationAndRome = (issues: $ZodIssue[]) =>
  getIssueForField<EstablishmentFormOffer>(issues, "appellationCode") ||
  getIssueForField<EstablishmentFormOffer>(issues, "appellationLabel") ||
  getIssueForField<EstablishmentFormOffer>(issues, "romeCode") ||
  getIssueForField<EstablishmentFormOffer>(issues, "romeLabel");

type CurrentOffer = OmitFromExistingKeys<
  EstablishmentFormOffer,
  "remoteWorkMode"
> & {
  remoteWorkMode?: RemoteWorkMode;
};

const emptyOffer: CurrentOffer = {
  appellationCode: "",
  appellationLabel: "",
  romeCode: "",
  romeLabel: "",
  remoteWorkMode: undefined,
};

const OfferModal = ({
  selectedOfferIndex,
}: {
  selectedOfferIndex: number | null;
}) => {
  const { watch, setValue } = useFormContext<FormEstablishmentDto>();
  const formValues = watch();
  const [currentOffer, setCurrentOffer] = useState<CurrentOffer>(
    selectedOfferIndex === null
      ? emptyOffer
      : formValues.offers[selectedOfferIndex],
  );
  const [errors, setErrors] = useState<$ZodIssue[]>([]);
  const dispatch = useDispatch();

  if (selectedOfferIndex !== null && equals(currentOffer, emptyOffer)) {
    setCurrentOffer(formValues.offers[selectedOfferIndex]);
  }

  useIsModalOpen(offerModal, {
    onConceal: () => {
      dispatch(
        appellationSlice.actions.clearLocatorDataRequested({
          locator: "form-establishment-offer-modal",
        }),
      );
    },
    onDisclose: () => {
      setCurrentOffer(emptyOffer);
      setErrors([]);
    },
  });

  return (
    <offerModal.Component
      title={
        selectedOfferIndex !== null ? "Modifier un métier" : "Ajouter un métier"
      }
      buttons={[
        {
          doClosesModal: true,
          children: "Annuler",
        },
        {
          doClosesModal: false,
          children:
            selectedOfferIndex !== null
              ? "Modifier ce métier"
              : "Ajouter ce métier",
          onClick: async () => {
            const { offers } = formValues;
            const validCurrentOfferResult =
              establishmentFormOfferSchema.safeParse(currentOffer);
            if (!validCurrentOfferResult.success) {
              setErrors(validCurrentOfferResult.error.issues);
              return;
            }
            const validCurrentOffer = validCurrentOfferResult.data;
            const newOffers =
              selectedOfferIndex === null
                ? [...offers, validCurrentOffer]
                : replaceAtIndex(offers, selectedOfferIndex, validCurrentOffer);
            setValue("offers", newOffers);
            offerModal.close();
          },
        },
      ]}
    >
      <Fragment key={selectedOfferIndex?.toString() ?? uuidV4()}>
        <AppellationAutocomplete
          label={"Rechercher un métier"}
          locator={"form-establishment-offer-modal"}
          initialInputValue={
            selectedOfferIndex
              ? formValues.offers[selectedOfferIndex].appellationLabel
              : undefined
          }
          onAppellationSelected={(appellationMatch) => {
            setCurrentOffer({
              ...currentOffer,
              appellationCode: appellationMatch.appellation.appellationCode,
              appellationLabel: appellationMatch.appellation.appellationLabel,
              romeCode: appellationMatch.appellation.romeCode,
              romeLabel: appellationMatch.appellation.romeLabel,
            });
            setErrors([]);
          }}
          onAppellationClear={() => {
            setCurrentOffer({
              ...emptyOffer,
              remoteWorkMode: currentOffer.remoteWorkMode,
            });
            setErrors([]);
          }}
          stateRelatedMessage={
            getIssueForAppellationAndRome(errors) ? (
              "Le métier sélectionné semble invalide"
            ) : (
              <>
                Les métiers sont basés sur la&nbsp;
                <a
                  href="https://candidat.francetravail.fr/metierscope/metiers"
                  target="_blank"
                  rel="noreferrer"
                >
                  liste officielle de France Travail
                </a>
              </>
            )
          }
          state={getIssueForAppellationAndRome(errors) ? "error" : "info"}
        />
        <RadioButtons
          legend={"Proposez-vous du télétravail sur ce métier ?"}
          options={remoteWorkModes.map((remoteWorkMode) => ({
            label: remoteWorkModeLabels[remoteWorkMode].label,
            nativeInputProps: {
              value: remoteWorkMode,
              checked: currentOffer.remoteWorkMode === remoteWorkMode,
              onChange: () => {
                setErrors([]);
                setCurrentOffer({
                  ...currentOffer,
                  remoteWorkMode,
                });
              },
            },
          }))}
          state={
            getIssueForField<EstablishmentFormOffer>(errors, "remoteWorkMode")
              ? "error"
              : "default"
          }
          stateRelatedMessage={
            getIssueForField<EstablishmentFormOffer>(errors, "remoteWorkMode")
              ? "Le mode de travail sélectionné semble invalide"
              : undefined
          }
        />
      </Fragment>
    </offerModal.Component>
  );
};

const remoteWorkModeLabels = {
  HYBRID: {
    label: "Télétravail hybride",
    description:
      "Apparaîtra dans les recherches pour tous vos lieux d’immersion",
  },
  "100% REMOTE": {
    label: "100% télétravail",
    description:
      "Apparaîtra pour la France entière, quelle que soit la localisation du candidat",
  },
  NO_REMOTE: {
    label: "Pas de télétravail",
    description:
      "Apparaîtra dans les recherches pour tous vos lieux d’immersion",
  },
};
