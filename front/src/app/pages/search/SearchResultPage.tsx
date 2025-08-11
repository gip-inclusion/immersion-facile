import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import {
  type ElementRef,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loader, MainWrapper } from "react-design-system";
import { Helmet } from "react-helmet-async";
import { useDispatch } from "react-redux";
import {
  type AppellationDto,
  type ContactMode,
  getMapsLink,
  makeAppellationInformationUrl,
  makeNafClassInformationUrl,
  makeSiretDescriptionLink,
  type SearchResultDto,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import {
  getIconMarker,
  SearchMiniMap,
} from "src/app/components/search/SearchMiniMap";
import { SearchResultContactSection } from "src/app/components/search/SearchResultContactSection";
import { SearchResultLabels } from "src/app/components/search/SearchResultLabels";
import { defaultPageMetaContents } from "src/app/contents/meta/metaContents";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes, useRoute } from "src/app/routes/routes";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import type { Route } from "type-route";

const getFeedBackMessage = (contactMode?: ContactMode) => {
  switch (contactMode) {
    case "EMAIL":
      return "L'entreprise a été contactée avec succès.";
    case "PHONE":
    case "IN_PERSON":
      return "Un email vient de vous être envoyé.";
    default:
      return null;
  }
};

const SearchResultSection = ({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) => (
  <div className={fr.cx("fr-mb-4w")}>
    <h2 className={fr.cx("fr-text--md", "fr-mb-1v")}>{title}</h2>
    {children}
  </div>
);

const getMetaForSearchResult = (
  currentSearchResult: SearchResultDto | null,
): {
  title: string;
  description: string;
} => {
  if (!currentSearchResult) return { title: "", description: "" };
  const hasAppellations = currentSearchResult.appellations?.length;
  return {
    title: `${currentSearchResult.name}${
      hasAppellations
        ? ` - ${currentSearchResult.appellations
            .map((appellation) => `${appellation.appellationLabel}`)
            .join(", ")}`
        : ""
    }`,
    description: `Fiche présentant l'immersion proposée par l'entreprise ${
      currentSearchResult?.name
    }${
      hasAppellations
        ? `en tant que ${currentSearchResult.appellations.map(
            (appellation) => appellation.appellationLabel,
          )}`
        : ""
    }`,
  };
};

export const SearchResultPage = ({ isExternal }: { isExternal?: boolean }) => {
  const route = useRoute() as Route<
    | typeof routes.searchResult
    | typeof routes.searchResultExternal
    | typeof routes.searchResultForStudent
  >;
  const currentSearchResult = useAppSelector(
    searchSelectors.currentSearchResult,
  );
  const defaultMetaContents = defaultPageMetaContents.searchResult;
  const isLoading = useAppSelector(searchSelectors.isLoading);
  const formContactRef = useRef<ElementRef<"div">>(null);
  const dispatch = useDispatch();
  const params = route.params;

  const isLocationMissing =
    !isExternal && !("location" in params && params.location);
  const shouldShowError =
    isLocationMissing ||
    !("appellationCode" in params && "siret" in params) ||
    (!isLoading && !currentSearchResult);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isExternal && "location" in params && params.location) {
      dispatch(
        searchSlice.actions.fetchSearchResultRequested({
          searchResult: {
            siret: params.siret,
            appellationCode: params.appellationCode,
            locationId: params.location,
          },
          feedbackTopic: "search-result",
        }),
      );
    }
    if (isExternal) {
      dispatch(
        searchSlice.actions.externalSearchResultRequested({
          siretAndAppellation: {
            appellationCode: params.appellationCode,
            siret: params.siret,
          },
          feedbackTopic: "search-result",
        }),
      );
    }
  }, [dispatch, isExternal, params]);

  const pluralFromAppellations = (
    appellations: AppellationDto[] | undefined,
  ) => (appellations && appellations.length > 1 ? "s" : "");
  const onFormSubmitSuccess = () => {
    document.body.scrollIntoView({
      behavior: "smooth",
    });
    setShowConfirmationMessage(
      getFeedBackMessage(currentSearchResult?.contactMode),
    );
  };
  const scrollToContactForm = () => {
    formContactRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };
  const onGoBackClick = () => {
    window.history.length > 2 ? window.history.back() : routes.search().push();
  };

  const miniMapMarkerKey = "single-result-mini-map-marker";

  return (
    <HeaderFooterLayout>
      <Helmet>
        <title>
          {getMetaForSearchResult(currentSearchResult).title} :{" "}
          {defaultMetaContents?.title}
        </title>
        <meta
          name="description"
          content={getMetaForSearchResult(currentSearchResult).description}
        />
      </Helmet>
      <MainWrapper layout="default">
        {isLoading && <Loader />}
        {shouldShowError && (
          <>
            {isLocationMissing && (
              <Alert
                title="Oups !"
                description={
                  "L'offre ne peut plus être affichée (paramètre de localisation invalide), veuillez relancer une recherche d'offre d'immersion pour retrouver une offre."
                }
                severity="error"
                className={fr.cx("fr-my-4w")}
              />
            )}
            <Feedback topics={["search-result"]} />
            <Button
              type="button"
              onClick={onGoBackClick}
              priority="tertiary"
              iconId="fr-icon-arrow-left-line"
              iconPosition="left"
              className={fr.cx("fr-mt-4w")}
            >
              Retour à la recherche
            </Button>
          </>
        )}
        {currentSearchResult && showConfirmationMessage === null && (
          <>
            <div className={fr.cx("fr-mb-4w")}>
              <Button
                type="button"
                onClick={onGoBackClick}
                priority="tertiary no outline"
                iconId="fr-icon-arrow-left-line"
                iconPosition="left"
              >
                Retour
              </Button>
            </div>
            <SearchResultLabels
              voluntaryToImmersion={currentSearchResult.voluntaryToImmersion}
              contactMode={currentSearchResult.contactMode}
              fitForDisabledWorkers={currentSearchResult.fitForDisabledWorkers}
            />
            <h1 className={fr.cx("fr-mb-4w", "fr-mt-2w")}>
              {currentSearchResult.customizedName ?? currentSearchResult.name}
            </h1>
            <div className={fr.cx("fr-grid-row")}>
              <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                <SearchResultSection title="Adresse">
                  <p>
                    {currentSearchResult.address.streetNumberAndAddress}
                    {", "}
                    <span>
                      {currentSearchResult.address.postcode}{" "}
                      {currentSearchResult.address.city}
                    </span>
                  </p>
                  <p>
                    SIRET&nbsp;:{" "}
                    <a
                      href={makeSiretDescriptionLink(currentSearchResult.siret)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {currentSearchResult.siret}
                    </a>
                  </p>
                </SearchResultSection>
                <SearchResultSection title="Secteur d'activité :">
                  <p>{currentSearchResult.nafLabel}</p>
                </SearchResultSection>

                {currentSearchResult.appellations.length > 0 && (
                  <SearchResultSection
                    title={`Métier${pluralFromAppellations(
                      currentSearchResult.appellations,
                    )} observable${pluralFromAppellations(
                      currentSearchResult.appellations,
                    )} :`}
                  >
                    <p>
                      {currentSearchResult.appellations
                        .map((appellation) => `${appellation.appellationLabel}`)
                        .join(", ")}
                    </p>
                  </SearchResultSection>
                )}
                <SearchResultSection>
                  {currentSearchResult.voluntaryToImmersion && (
                    <Button type="button" onClick={scrollToContactForm}>
                      Contacter l'entreprise
                    </Button>
                  )}

                  {!currentSearchResult.voluntaryToImmersion && (
                    <>
                      <p>
                        Cette entreprise n'est pas inscrite comme entreprise
                        accueillante mais peut recruter sur le métier que vous
                        souhaitez tester en immersion.
                      </p>
                      <ButtonsGroup
                        inlineLayoutWhen="md and up"
                        buttons={[
                          {
                            onClick: scrollToContactForm,
                            children: "Voir nos conseils",
                            priority: "secondary",
                          },
                          {
                            linkProps: {
                              href: currentSearchResult.urlOfPartner,
                              target: "_blank",
                            },
                            children: "Voir l'offre sur La Bonne Boite",
                          },
                        ]}
                      />
                    </>
                  )}
                </SearchResultSection>
                <SearchResultSection title="Nombre de salariés">
                  <p>{currentSearchResult.numberOfEmployeeRange}</p>
                </SearchResultSection>

                {currentSearchResult.additionalInformation && (
                  <SearchResultSection title="Informations complémentaires">
                    <p>{currentSearchResult.additionalInformation}</p>
                  </SearchResultSection>
                )}

                {currentSearchResult.website && (
                  <SearchResultSection title="Site web">
                    <a
                      href={currentSearchResult.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {currentSearchResult.website}
                    </a>
                  </SearchResultSection>
                )}
                <SearchResultSection title="Avoir plus d'informations avant de contacter l'entreprise">
                  <ul>
                    {currentSearchResult.appellations.length > 0 && (
                      <li>
                        <a
                          href={makeAppellationInformationUrl(
                            currentSearchResult.rome,
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          S'informer sur le métier
                        </a>
                      </li>
                    )}
                    <li>
                      <a
                        href={makeNafClassInformationUrl(
                          currentSearchResult.naf,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        S'informer sur le domaine
                      </a>
                    </li>
                    <li>
                      <a
                        href={getMapsLink(currentSearchResult)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Localiser l'entreprise
                      </a>
                    </li>
                  </ul>
                </SearchResultSection>
              </div>
              <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                <SearchMiniMap
                  kind="single"
                  markerProps={{
                    position: [
                      currentSearchResult.position.lat,
                      currentSearchResult.position.lon,
                    ],
                    icon: getIconMarker(
                      miniMapMarkerKey,
                      currentSearchResult,
                      miniMapMarkerKey,
                    ),
                  }}
                />
              </div>
            </div>
            <SearchResultContactSection
              onFormSubmitSuccess={onFormSubmitSuccess}
              formContactRef={formContactRef}
              currentSearchResult={currentSearchResult}
            />
          </>
        )}
        {showConfirmationMessage && (
          <>
            <Alert
              title="Bravo !"
              description={
                <p>{getFeedBackMessage(currentSearchResult?.contactMode)}</p>
              }
              severity="success"
              className={fr.cx("fr-my-4w")}
            />
            <Button
              type="button"
              onClick={onGoBackClick}
              priority="tertiary"
              iconId="fr-icon-arrow-left-line"
              iconPosition="left"
              className={fr.cx("fr-mt-1w")}
            >
              Retour à la recherche
            </Button>
          </>
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
