/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-prisma',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '@prisma/client' },
    },
    {
      name: 'domain-no-nest',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '@nestjs' },
    },
    {
      name: 'domain-no-infra',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'application-no-infra',
      severity: 'error',
      from: {
        path: '^src/application',
        pathNot: '\\.spec\\.ts$',
      },
      to: { path: '^src/infrastructure' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
  },
};
