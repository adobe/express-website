import { importMapsPlugin } from '@web/dev-server-import-maps';
import { defaultReporter } from '@web/test-runner';

function customReporter() {
  return {
    async reportTestFileResults({ logger, sessionsForTestFile }) {
      sessionsForTestFile.forEach((session) => {
        session.testResults.tests.forEach((test) => {
          if (!test.passed && !test.skipped) {
            logger.log(test);
          }
        });
      });
    },
  };
}
export default {
  coverageConfig: {
    include: [
      '**/express/blocks**',
      '**/express/scripts/**',
    ],
    exclude: [
      '**/node_modules/**',
      '**/test/**',
    ],
  },
  plugins: [importMapsPlugin({})],
  reporters: [
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
    customReporter(),
  ],
};
