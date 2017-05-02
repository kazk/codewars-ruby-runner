FROM node:7.9-alpine

RUN adduser -D codewarrior
RUN ln -s /home/codewarrior /workspace

RUN apk --no-cache add \
    bash \
    coreutils \
    findutils \
    git \
    redis \
    ruby=2.3.1-r0 \
    ruby-json \
    ruby-io-console \
    ruby-bigdecimal

RUN gem install --no-ri --no-rdoc \
    rspec \
    redis

WORKDIR /runner
ENV NPM_CONFIG_LOGLEVEL=warn
COPY package.json /runner/package.json
RUN npm install --only=prod

COPY lib /runner/lib
COPY docker/frameworks /runner/frameworks
COPY docker/run-json.js /runner/run-json.js

USER codewarrior
ENV USER=codewarrior HOME=/home/codewarrior

# timeout is a fallback in case an error with node
# prevents it from exiting properly
ENTRYPOINT ["timeout", "15", "node"]
