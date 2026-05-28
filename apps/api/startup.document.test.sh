#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh mongo:27017
/opt/wait-for-it.sh maildev:1080
node -e "const fs=require('fs'),pkg=JSON.parse(fs.readFileSync('./package.json'));delete pkg.devDependencies['@n2base/eslint-config'];delete pkg.devDependencies['@n2base/tsconfig'];fs.writeFileSync('./package.json',JSON.stringify(pkg));"
printf 'allowBuilds:\n  "@nestjs/core": true\n  "@scarf/scarf": true\n  "@swc/core": true\n  unrs-resolver: true\n' > pnpm-workspace.yaml
pnpm install --no-frozen-lockfile
mkdir -p node_modules/@n2base/tsconfig
printf '{"compilerOptions":{"skipLibCheck":true,"esModuleInterop":true,"resolveJsonModule":true,"forceConsistentCasingInFileNames":true}}' > node_modules/@n2base/tsconfig/base.json
printf '{"$schema":"https://json.schemastore.org/tsconfig","extends":"./base.json","compilerOptions":{"target":"ES2021","lib":["ES2021"],"module":"commonjs","experimentalDecorators":true,"emitDecoratorMetadata":true}}' > node_modules/@n2base/tsconfig/nestjs.json
pnpm run seed:run:document
pnpm run start:dev
