import fs from "fs";
import path from "path";
import sass from "sass";
import { extract } from "string-extract-class-names";
export const toCamelCase = (string) =>
  string
    .split(/[_\- ]+/)
    .filter(Boolean)
    .map((word, index) =>
      index === 0
        ? word.replace(/^_+/, "")
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
export const getScssData = (componentName, filename) => {
  const { css } = sass.compile(filename);
  const { res: classes } = extract(css);
  const filteredClasses = classes
    .filter((result) => result.includes(componentName))
    .map((className) => className.replace(".", ""));
  if (filteredClasses.at(0) !== componentName) {
    filteredClasses.unshift(componentName);
  }
  const dedupedClasses = [...new Set(filteredClasses)];
  const keysToClasses = [
    ...dedupedClasses
      .map((className) => {
        const element = className.replace(componentName, "");
        return {
          key: toCamelCase(element),
          className,
        };
      })
      .filter(
        (keyToClassName) =>
          keyToClassName.className !== "" && keyToClassName.key !== "",
      ),
  ];
  return {
    filename,
    classes,
    filteredClasses: dedupedClasses,
    keysToClasses,
  };
};
export const makeTsFileContent = (componentName, filePath) => {
  const { filename, keysToClasses } = getScssData(componentName, filePath);
  const fileBaseName = path.basename(filename);
  return `import './${fileBaseName}';
  
    export default {
      root: '${componentName}',
      ${keysToClasses
        .map(
          (keyToClassName) =>
            `${keyToClassName.key}: '${keyToClassName.className}'`,
        )
        .join(",\n")}
    }
  `;
};
const makeTsFileName = (filePath) => {
  const tsFileName = filePath.replace(".scss", ".styles.ts");
  return tsFileName;
};
export const writeTsFile = (componentName, filePath) => {
  const content = makeTsFileContent(componentName, filePath);
  fs.writeFile(makeTsFileName(filePath), content, (error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
    // eslint-disable-next-line no-console
    console.info(`${makeTsFileName(filePath)} created`);
  });
};
export const processScssFiles = (componentName, folder = "./") => {
  fs.readdirSync(folder).forEach((filePath) => {
    if (!filePath.includes(".scss")) return;
    // eslint-disable-next-line no-console
    console.info(filePath);
    writeTsFile(componentName, folder + filePath);
    fs.watch(folder + filePath, (_, filename) => {
      // eslint-disable-next-line no-console
      console.info(`${filename} file changed`);
      writeTsFile(componentName, folder + filePath);
    });
  });
};
