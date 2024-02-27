export type EntityFromDto<Dto, EntityName> = Dto & {
  _entityName: EntityName;
};
