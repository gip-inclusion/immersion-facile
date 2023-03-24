#!

echo "Transpiling..."
rm -rf build
rm back-build.tar.gz
pnpm build-tsc

echo "Coping package.json of back, shared, and libs for prod..."
# root package.json
cp -v ../package.json build/package.json
cp -v ../pnpm-lock.yaml build/pnpm-lock.yaml
cp -v ../pnpm-workspace.yaml build/pnpm-workspace.yaml
#cp -v ../.env build/back/.env
cp -v -R ./src/adapters/secondary/pg/staticData build/back/src/adapters/secondary/pg/staticData

# back package.json
cp -v package.json build/back/package.json

# dependencies package.json
cp -v ../shared/package.json build/shared/package.json
cp -v ../libs/http-client/package.json build/libs/http-client/package.json
cp -v ../libs/html-templates/package.json build/libs/html-templates/package.json

# remove precommit from root package.json
#sed -i "/prepare/d" build/package.json

#For mac
sed -i "" -e "/prepare/d" build/package.json

## change dependencies to use js instead of ts
#sed -i "/\"types\": \"src\/index.ts\"/d" build/libs/http-client/package.json
#sed -i "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/" build/libs/http-client/package.json
#sed -i "/\"types\": \"src\/index.ts\"/d" build/libs/html-templates/package.json
#sed -i "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/"  build/libs/html-templates/package.json
#sed -i "/\"types\": \"src\/index.ts\"/d" build/shared/package.json
#sed -i "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/"  build/shared/package.json
## change ts-node scripts to node scripts
#sed -i "s/\"ts-node /\"node /g"  build/back/package.json
#sed -i -r "s/(\"node .*)(\.ts)/\1\.js/g"  build/back/package.json
## change migration script from ts source files to js
#sed -i "s/node_modules\/node-pg-migrate\/bin\/node-pg-migrate -j ts/node_modules\/node-pg-migrate\/bin\/node-pg-migrate/"  build/back/package.json

# For mac
sed -i "" -e "/\"types\": \"src\/index.ts\"/d" build/libs/http-client/package.json
sed -i "" -e "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/" build/libs/http-client/package.json
sed -i "" -e "/\"types\": \"src\/index.ts\"/d" build/libs/html-templates/package.json
sed -i "" -e "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/"  build/libs/html-templates/package.json
sed -i "" -e "/\"types\": \"src\/index.ts\"/d" build/shared/package.json
sed -i "" -e "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/"  build/shared/package.json
# change ts-node scripts to node scripts
sed -i "" -e "s/\"ts-node /\"node /g"  build/back/package.json
sed -i "" -E "s/(\"node .*)(\.ts)/\1\.js/g"  build/back/package.json
# change migration script from ts source files to js
sed -i "" -e "s/node_modules\/node-pg-migrate\/bin\/node-pg-migrate -j ts/node_modules\/node-pg-migrate\/bin\/node-pg-migrate/"  build/back/package.json

echo "web: cd back && pnpm prod-tsc\npostdeploy: cd back && pnpm migrate up" > build/Procfile
echo "https://github.com/unfold/heroku-buildpack-pnpm" > build/.buildpacks
echo '{"jobs": [
      {
             "command": "*/10 * * * * pnpm back run trigger-refresh-materialized-views",
             "size": "M"
           }
         ]}' > build/cron.json

echo "Making tar.gz from transpiled code"

chmod -R 755 build

tar -czf back-build.tar.gz build
