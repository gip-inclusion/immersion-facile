You need node 12+ to use the app :

**Install**

```
npm install
```

**To test the app :**

```
npm run test:all
```

You can run in watch mode individually :
Unit tests :

```
npm run test:unit
```

Integration tests :

```
npm run test:integration
```

End to end tests :

```
npm run test:e2e
```

## Start the app :

# To start with IN_MEMORY database, and an actual clock :

```
npm start
```

# With the JSON database

```
npm run start:json
```

If you want to fake that it is the morning (time during when the app is suppose to work), you can add `NODE_ENV=test`, to use the ClockImplementations. For exemple :

```
NODE_ENV=test npm run start:json
```
