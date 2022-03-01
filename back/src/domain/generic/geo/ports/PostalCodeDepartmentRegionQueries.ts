export type DepartmentAndRegion = {
  department: string;
  region: string;
};

export interface PostalCodeDepartmentRegionQueries {
  getAllRegionAndDepartmentByPostalCode: () => Promise<
    Record<string, DepartmentAndRegion>
  >;
}
