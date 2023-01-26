import {
  AppJwtPayload,
  FormEstablishmentBatchDto,
  formEstablishmentBatchSchema,
  splitInChunks,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { AddFormEstablishment } from "./AddFormEstablishment";
// import { promise } from "zod";

export class AddFormEstablishmentBatch extends TransactionalUseCase<
  FormEstablishmentBatchDto,
  void,
  AppJwtPayload
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private addFormEstablishmentUsecase: AddFormEstablishment, //private createNewEvent: CreateNewEvent, // private readonly getSiret: GetSiretUseCase,
  ) {
    super(uowPerformer);
  }

  protected inputSchema = formEstablishmentBatchSchema;

  protected async _execute(params: FormEstablishmentBatchDto): Promise<void> {
    const sizeOfChunk = 15;
    const chunksOfFormEstablishments = splitInChunks(
      params.formEstablishments,
      sizeOfChunk,
    );

    for (let i = 0; i < chunksOfFormEstablishments.length; i++) {
      const chunkOfFormEstablishments = chunksOfFormEstablishments[i];
      await Promise.all(
        chunkOfFormEstablishments.map((formEstablishment) =>
          this.addFormEstablishmentUsecase.execute(formEstablishment),
        ),
      );
    }
  }
}
