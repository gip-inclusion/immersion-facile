// Parse search params from a location.
// Example usage:
// // Current location is localhost/some/path?fruit=apple&color=green
// const params = parseSearchParams(location.search)
// assert(params.fruit === apple)
export const parseSearchParams = (search: string) => {
  if (search.length === 0 || search[0] !== "?") {
    return {};
  }

  search = search.substring(1);

  const pairs = search.split("&");
  const retObj = {} as any;
  for (const p of pairs) {
    const [k, v] = p.split("=");
    retObj[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return retObj;
};
