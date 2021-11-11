import { v4 as uuidV4 } from "uuid";
import {
  BusinessContactDto,
  FormEstablishmentId,
  formEstablishmentIdSchema,
} from "../../../shared/FormEstablishmentDto";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "../entities/ImmersionOfferEntity";
import {
  GetExtraEstablishmentInfos,
  GetPosition,
  UncompleteEstablishmentEntity,
} from "../entities/UncompleteEstablishmentEntity";
import { FormEstablishmentRepository } from "../ports/FormEstablishmentRepository";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { SireneRepository } from "../../sirene/ports/SireneRepository";
import { UseCase } from "../../core/UseCase";

export class TransformFormEstablishmentIntoSearchData extends UseCase<
  FormEstablishmentId,
  ImmersionOfferEntity[]
> {
  constructor(
    private readonly formEstablishmentRepository: FormEstablishmentRepository,
    private immersionOfferRepository: ImmersionOfferRepository,
    private getPosition: GetPosition,
    private sirenRepositiory: SireneRepository, // private getExtraEstablishmentInfos: GetExtraEstablishmentInfos,
  ) {
    super();
  }

  inputSchema = formEstablishmentIdSchema;

  public async _execute(
    id: FormEstablishmentId,
  ): Promise<ImmersionOfferEntity[]> {
    const formEstablishment = await this.formEstablishmentRepository.getById(
      id,
    );
    if (formEstablishment) {
      //Insert contact
      const establishmentContact: ImmersionEstablishmentContact =
        this.convertBusinessContactDtoToImmersionEstablishmentContact(
          formEstablishment.businessContacts[0],
          formEstablishment.siret,
        );

      //Insert establishment
      const romeCodes = formEstablishment.professions
        .map((x) => x.romeCodeMetier)
        .filter((x): x is string => x !== undefined);

      const uncompleteEstablishmentEntity: UncompleteEstablishmentEntity =
        new UncompleteEstablishmentEntity({
          id: uuidV4(),
          siret: formEstablishment.siret,
          name: formEstablishment.businessName,
          address: formEstablishment.businessAddress,
          score: 10,
          voluntary_to_immersion: true,
          romes: romeCodes,
          dataSource: "form",
          contact_in_establishment: establishmentContact,
          contact_mode: formEstablishment.preferredContactMethods[0],
        });

      const establishmentEntity =
        await uncompleteEstablishmentEntity.searchForMissingFields(
          this.getPosition,
          this.sirenRepositiory,
        );

      if (establishmentEntity) {
        //Extract immersion
        const immersions = establishmentEntity.extractImmersions();

        //We insert the establishment
        this.immersionOfferRepository.insertEstablishments([
          establishmentEntity,
        ]);
        //Insert establishment contact
        await this.immersionOfferRepository.insertEstablishmentContact(
          establishmentContact,
        );
        //Insert immersions
        await this.immersionOfferRepository.insertImmersions(
          establishmentEntity.extractImmersions(),
        );
        return immersions;
      }
      return [];
    } else {
      return [];
    }
  }
  private convertBusinessContactDtoToImmersionEstablishmentContact(
    businessContactDto: BusinessContactDto,
    siret_institution: string,
  ): ImmersionEstablishmentContact {
    return {
      id: uuidV4(),
      name: businessContactDto.lastName,
      firstname: businessContactDto.firstName,
      email: businessContactDto.email,
      role: businessContactDto.job,
      siretEstablishment: siret_institution,
    };
  }
}
