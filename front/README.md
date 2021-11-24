## Frontend documentation

#### Install

In front folder, install node modules:
```shell
npm install
```

#### Run local dev, with faked backend
```shell
npm run dev
```

#### Run local dev, calling backend
```shell
npm run dev-http
```

You can typecheck the project with :
```shell
npm run typecheck
```

If you want to make sure everything is fine before pushing for exemple, you can run :
```shell
npm run fullcheck
```


The frontend and the backend have some shared code which is located in the `back/src/shared` folder.
In local, we make a symlink to point to this folder from : `front/src/shared`

You can make sure the symlink is up to date with :
```shell
npm run symlink-shared
```



