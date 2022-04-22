import { Clock } from "../domain/core/ports/Clock";
import { SequenceRunner } from "../domain/core/ports/SequenceRunner";
import { UuidGenerator } from "../domain/core/ports/UuidGenerator";
import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
  TefenCode,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { AdresseAPI } from "../domain/immersionOffer/ports/AdresseAPI";
import {
  SireneEstablishmentVO,
  SireneRepository,
  SireneRepositoryAnswer,
} from "../domain/sirene/ports/SireneRepository";
import { FormEstablishmentDto } from "../shared/formEstablishment/FormEstablishment.dto";
import { NafDto } from "../shared/naf";
import { notifyAndThrowErrorDiscord } from "./notifyDiscord";

const offerFromFormScore = 10; // 10/10 if voluntaryToImmersion=true (consider removing this field)

// Those will probably be shared in a utils/helpers folder
const inferNafDtoFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): NafDto | undefined => {
  const establishmentProps = sireneRepoAnswer.etablissements[0];
  if (!establishmentProps) return;
  return new SireneEstablishmentVO(establishmentProps).nafAndNomenclature;
};

const inferNumberEmployeesRangeFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): TefenCode => {
  const tefenCode =
    sireneRepoAnswer.etablissements[0].uniteLegale.trancheEffectifsUniteLegale;

  if (tefenCode && tefenCode != "NN") return <TefenCode>+tefenCode;
  return -1;
};

export const makeFormEstablishmentToEstablishmentAggregate = ({
  uuidGenerator,
  clock,
  adresseAPI,
  sireneRepository,
  sequenceRunner,
}: {
  uuidGenerator: UuidGenerator;
  clock: Clock;
  adresseAPI: AdresseAPI;
  sireneRepository: SireneRepository;
  sequenceRunner: SequenceRunner;
}) => {
  const formEstablishmentToEstablishmentAggregate = async (
    formEstablishment: FormEstablishmentDto,
  ): Promise<EstablishmentAggregate | undefined> => {
    const position = await adresseAPI.getPositionFromAddress(
      formEstablishment.businessAddress,
    );
    const sireneRepoAnswer = await sireneRepository.get(
      formEstablishment.siret,
    );
    if (!sireneRepoAnswer) {
      await notifyAndThrowErrorDiscord(
        new Error(
          `Could not get siret ${formEstablishment.siret} from siren gateway`,
        ),
      );
      return;
    }
    const nafDto = inferNafDtoFromSireneAnswer(sireneRepoAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneRepoAnswer);

    if (!nafDto || !position || numberEmployeesRange === undefined) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Some field from siren gateway are missing for establishment with siret ${formEstablishment.siret} : nafDto=${nafDto}; position=${position}; numberEmployeesRange=${numberEmployeesRange}`,
        ),
      );
      return;
    }

    const contact: ContactEntityV2 = {
      id: uuidGenerator.new(),
      ...formEstablishment.businessContact,
    };

    const immersionOffers: ImmersionOfferEntityV2[] = (
      await sequenceRunner.run(
        formEstablishment.appellations,
        async ({
          romeCode,
          appellationCode,
        }): Promise<ImmersionOfferEntityV2 | undefined> => ({
          id: uuidGenerator.new(),
          romeCode,
          appellationCode: appellationCode ? appellationCode : undefined,
          score: offerFromFormScore,
        }),
      )
    ).filter((offer): offer is ImmersionOfferEntityV2 => !!offer);

    const establishment: EstablishmentEntityV2 = {
      siret: formEstablishment.siret,
      name: formEstablishment.businessName,
      customizedName: formEstablishment.businessNameCustomized,
      isCommited: formEstablishment.isEngagedEnterprise,
      address: formEstablishment.businessAddress,
      voluntaryToImmersion: true,
      dataSource: "form",
      sourceProvider: formEstablishment.source,
      nafDto,
      position,
      numberEmployeesRange,
      isActive: true,
      updatedAt: clock.now(),
      isSearchable: formEstablishment.isSearchable,
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contact,
      immersionOffers,
    };
    return establishmentAggregate;
  };

  return formEstablishmentToEstablishmentAggregate;
};
