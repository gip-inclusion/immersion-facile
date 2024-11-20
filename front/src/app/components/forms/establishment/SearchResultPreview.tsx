import { fr } from "@codegouvfr/react-dsfr";
import { SearchResultIllustration, Tag as ImTag } from "react-design-system";
import { FormEstablishmentDto, SearchResultDto } from "shared";
import { searchIllustrations } from "src/assets/img/illustrations";
import { useStyles } from "tss-react/dsfr";
import { SearchResult } from "../../search/SearchResult";

const establishmentToSearchResultPreview = ({
  appellations,
  naf,
  businessNameCustomized,
  businessName,
  businessAddresses,
  siret,
  website,
  fitForDisabledWorkers,
  additionalInformation,
}: FormEstablishmentDto): SearchResultDto => ({
  establishmentScore: 0,
  rome: appellations.length > 0 ? appellations[0].romeCode : "",
  romeLabel: appellations.length > 0 ? appellations[0].romeLabel : "",
  appellations: appellations,
  nafLabel: "",
  naf: naf?.code || "",
  name: businessNameCustomized || businessName || "Mon entreprise",
  // Fake data
  voluntaryToImmersion: true,
  position: {
    lat: 0,
    lon: 0,
  },
  address: {
    streetNumberAndAddress: businessAddresses[0]?.rawAddress ?? "",
    city: "",
    departmentCode: "",
    postcode: "",
  },
  siret,
  website,
  fitForDisabledWorkers,
  additionalInformation,
  locationId: "",
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
});

type SearchResultPreviewProps = {
  establishment: FormEstablishmentDto;
};

export const SearchResultPreview = ({
  establishment,
}: SearchResultPreviewProps) => {
  const { cx } = useStyles();
  return (
    <section className={cx("im-establishment-preview")}>
      <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
        Prévisualisation de votre entreprise
      </h2>
      <p className={fr.cx("fr-hint-text")}>
        Voici un exemple d'aperçu de votre entreprise, tel qu'il apparaitra dans
        notre moteur de recherche
      </p>
      <div
        className={cx(
          fr.cx("fr-grid-row", "fr-mb-4w"),
          "im-establishment-preview__inner",
        )}
      >
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
          <SearchResult
            illustration={
              <SearchResultIllustration illustration={searchIllustrations[0]}>
                <div className={fr.cx("fr-p-1v")}>
                  {establishment.fitForDisabledWorkers && (
                    <ImTag theme="rqth" />
                  )}
                  <ImTag theme="voluntaryToImmersion" />
                </div>
              </SearchResultIllustration>
            }
            linkProps={{
              href: "#",
              onClick: () => {},
            }}
            establishment={establishmentToSearchResultPreview(establishment)}
            preview
          />
        </div>
      </div>
    </section>
  );
};
