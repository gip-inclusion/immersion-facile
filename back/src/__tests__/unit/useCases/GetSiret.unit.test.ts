import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { Establishment } from "./../../../domain/sirene/ports/SireneRepository";

const validEstablishment: Establishment = {
  siret: "12345678901234",
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE",
    activitePrincipaleUniteLegale: "78.3Z",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};

describe("GetSiret", () => {
  let repository: InMemorySireneRepository;
  let getSiret: GetSiret;

  beforeEach(() => {
    repository = new InMemorySireneRepository();
    getSiret = new GetSiret(repository);
  });

  test("throws NotFoundError wher siret not found", async () => {
    await expectPromiseToFailWithError(
      getSiret.execute({ siret: "40440440440400" }),
      new NotFoundError("40440440440400"),
    );
  });

  test("returns the parsed info when siret found", async () => {
    repository.setEstablishment(validEstablishment);
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response).toEqual({
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      naf: { code: "78.3Z", nomenclature: "Ref2" },
    });
  });

  test("populates businessName from nom/prenom when denomination not available", async () => {
    repository.setEstablishment({
      ...validEstablishment,
      uniteLegale: {
        prenomUsuelUniteLegale: "ALAIN",
        nomUniteLegale: "PROST",
      },
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessName).toEqual("ALAIN PROST");
  });

  test("skips missing parts of adresseEtablissment", async () => {
    repository.setEstablishment({
      ...validEstablishment,
      adresseEtablissement: {
        // No numeroVoieEtablissement
        typeVoieEtablissement: "L'ESPLANADE",
        // No libelleVoieEtablissement
        codePostalEtablissement: "30430",
        libelleCommuneEtablissement: "BARJAC",
      },
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.businessAddress).toEqual("L'ESPLANADE 30430 BARJAC");
  });

  test("skips naf when not available", async () => {
    repository.setEstablishment({
      ...validEstablishment,
      uniteLegale: {
        denominationUniteLegale: "MA P'TITE BOITE",
        // no activitePrincipaleUniteLegale
        // no nomenclatureActivitePrincipaleUniteLegale
      },
    });
    const response = await getSiret.execute({
      siret: validEstablishment.siret,
    });
    expect(response.naf).toBeUndefined();
  });
});
