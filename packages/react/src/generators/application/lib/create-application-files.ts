import { names, offsetFromRoot, Tree, toJS, generateFiles } from '@nx/devkit';
import { getRelativePathToRootTsConfig } from '@nx/js';
import { join } from 'path';
import { createTsConfig } from '../../../utils/create-ts-config';
import { getInSourceVitestTestsTemplate } from '../../../utils/get-in-source-vitest-tests-template';
import { NormalizedSchema } from '../schema';
import { getAppTests } from './get-app-tests';

export function createApplicationFiles(host: Tree, options: NormalizedSchema) {
  let styleSolutionSpecificAppFiles: string;
  if (options.styledModule && options.style !== 'styled-jsx') {
    styleSolutionSpecificAppFiles = '../files/style-styled-module';
  } else if (options.style === 'styled-jsx') {
    styleSolutionSpecificAppFiles = '../files/style-styled-jsx';
  } else if (options.style === 'none') {
    styleSolutionSpecificAppFiles = '../files/style-none';
  } else if (options.globalCss) {
    styleSolutionSpecificAppFiles = '../files/style-global-css';
  } else {
    styleSolutionSpecificAppFiles = '../files/style-css-module';
  }

  const relativePathToRootTsConfig = getRelativePathToRootTsConfig(
    host,
    options.appProjectRoot
  );
  const appTests = getAppTests(options);
  const templateVariables = {
    ...names(options.name),
    ...options,
    tmpl: '',
    offsetFromRoot: offsetFromRoot(options.appProjectRoot),
    appTests,
    inSourceVitestTests: getInSourceVitestTestsTemplate(appTests),
  };

  let fileDirectory: string;
  if (options.bundler === 'vite') {
    fileDirectory = join(__dirname, '../files/base-vite');
  } else if (options.bundler === 'webpack') {
    fileDirectory = join(__dirname, '../files/base-webpack');
  } else if (options.bundler === 'rspack') {
    fileDirectory = join(__dirname, '../files/base-rspack');
  }

  generateFiles(host, fileDirectory, options.appProjectRoot, templateVariables);

  if (
    options.unitTestRunner === 'none' ||
    (options.unitTestRunner === 'vitest' && options.inSourceTests == true)
  ) {
    host.delete(
      `${options.appProjectRoot}/src/app/${options.fileName}.spec.tsx`
    );
  }

  if (!options.minimal) {
    generateFiles(
      host,
      join(__dirname, '../files/nx-welcome'),
      options.appProjectRoot,
      templateVariables
    );
  }

  generateFiles(
    host,
    join(__dirname, styleSolutionSpecificAppFiles),
    options.appProjectRoot,
    templateVariables
  );

  if (options.js) {
    toJS(host);
  }

  createTsConfig(
    host,
    options.appProjectRoot,
    'app',
    options,
    relativePathToRootTsConfig
  );
}
