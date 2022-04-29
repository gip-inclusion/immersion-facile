## Frontend documentation

#### Install

In front folder, install node modules:
```shell
pnpm install
```

#### Run local dev, with faked backend
```shell
pnpm dev
```

#### Run local dev, calling backend
```shell
pnpm dev-http
```

You can typecheck the project with :
```shell
pnpm typecheck
```

If you want to make sure everything is fine before pushing for exemple, you can run :
```shell
pnpm fullcheck
```


The frontend and the backend have some shared code which is located in the `shared` folder.
It is a workspace, used in front and in back



