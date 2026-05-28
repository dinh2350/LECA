FROM node:24.14.1-alpine

RUN apk add --no-cache bash
RUN npm i -g pnpm @nestjs/cli typescript ts-node

COPY package*.json /tmp/app/
RUN cd /tmp/app && \
    node -e "const fs=require('fs'),pkg=JSON.parse(fs.readFileSync('./package.json'));delete pkg.devDependencies['@n2base/eslint-config'];delete pkg.devDependencies['@n2base/tsconfig'];fs.writeFileSync('./package.json',JSON.stringify(pkg));" && \
    printf 'allowBuilds:\n  "@nestjs/core": true\n  "@scarf/scarf": true\n  "@swc/core": true\n  unrs-resolver: true\n' > pnpm-workspace.yaml && \
    pnpm install --no-frozen-lockfile

COPY . /usr/src/app

COPY ./wait-for-it.sh /opt/wait-for-it.sh
RUN chmod +x /opt/wait-for-it.sh
COPY ./startup.document.test.sh /opt/startup.document.test.sh
RUN chmod +x /opt/startup.document.test.sh
RUN sed -i 's/\r//g' /opt/wait-for-it.sh
RUN sed -i 's/\r//g' /opt/startup.document.test.sh

WORKDIR /usr/src/app

RUN echo "" > .env

CMD ["/opt/startup.document.test.sh"]
