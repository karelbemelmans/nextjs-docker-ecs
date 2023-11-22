[![Build & Publish](https://github.com/karelbemelmans/nextjs-docker/actions/workflows/build.yaml/badge.svg)](https://github.com/karelbemelmans/nextjs-docker/actions/workflows/build.yaml)
[![CodeQL](https://github.com/karelbemelmans/nextjs-docker/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/karelbemelmans/nextjs-docker/actions/workflows/github-code-scanning/codeql)

# NextJS, Docker and ECS

My attempt to create a very clean NextJS project that creates the AWS ECS infrastructure with CDK and deploys new NextJS containers using Github Actions.

## Infrastructure

This project uses AWS CDK to create infrastructure. The CDK code lives in the `cdk` folder and is written with TypeScript.

Deployment:

```sh
cdk --profile AWS_PROFILE bootstrap
cdk --profile AWS_PROFILE deploy
```

## TODO

- Everything should use the node version from `.nvmrc``
- Provide some nicer default homepage than the current NextJS default one
