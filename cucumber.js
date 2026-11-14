module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register/transpile-only'],
    require: ['features/step_definitions/**/*.ts'],
    format: ['progress-bar', 'summary'],
    publishQuiet: true,
  },
};
