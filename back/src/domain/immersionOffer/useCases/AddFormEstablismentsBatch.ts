import {
  AppJwtPayload,
  FormEstablishmentBatchDto,
  formEstablishmentBatchSchema,
  splitInChunks,
} from "shared";
import { UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UseCase } from "../../core/UseCase";
import { EstablishmentGroupEntity } from "../entities/EstablishmentGroupEntity";
import { AddFormEstablishment } from "./AddFormEstablishment";

export class AddFormEstablishmentBatch extends UseCase<
  FormEstablishmentBatchDto,
  void,
  AppJwtPayload
> {
  constructor(
    private addFormEstablishmentUseCase: AddFormEstablishment,
    private uowPerformer: UnitOfWorkPerformer,
  ) {
    super();
  }

  protected inputSchema = formEstablishmentBatchSchema;

  protected async _execute({
    formEstablishments,
    groupName,
  }: FormEstablishmentBatchDto): Promise<void> {
    const group: EstablishmentGroupEntity = {
      name: groupName,
      sirets: formEstablishments.map(({ siret }) => siret),
    };
    await this.uowPerformer.perform((uow) =>
      uow.establishmentGroupRepository.save(group),
    );

    const sizeOfChunk = 15;
    const chunksOfFormEstablishments = splitInChunks(
      formEstablishments,
      sizeOfChunk,
    );

    for (let i = 0; i < chunksOfFormEstablishments.length; i++) {
      const chunkOfFormEstablishments = chunksOfFormEstablishments[i];
      await Promise.all(
        chunkOfFormEstablishments.map((formEstablishment) =>
          this.addFormEstablishmentUseCase.execute(formEstablishment),
        ),
      );
    }
  }
}
