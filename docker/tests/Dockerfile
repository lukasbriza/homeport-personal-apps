# ARG TO BE DEFINED:
# - TAG

# For all available tags look at https://hub.docker.com/repository/docker/lbriza/shared/tags
ARG TAG=base-latest

FROM lbriza/shared:${TAG} AS shared

COPY package.json .
RUN corepack prepare "$(jq -r '.packageManager' package.json)" --activate 
RUN rm package.json

WORKDIR /workspace
COPY . .
RUN pnpm install
RUN pnpm turbo build --filter="./packages/*"

ENTRYPOINT ["pnpm", "turbo", "test"]
