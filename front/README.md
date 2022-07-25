## Frontend documentation

#### Install

**In root folder**, install all dependencies (also installs the backend dependencies):
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

### E2E Tests with Cypress

#### Run locally
##### Linux prerequisites 
```shell
sudo apt-get update && sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

### Open the app
At the root of the project run :
```shell
pnpm cypress
```
