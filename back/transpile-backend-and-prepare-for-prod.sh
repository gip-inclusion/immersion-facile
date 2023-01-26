#!

echo "Transpiling..."
rm -rf build
rm back-build.tar.gz
pnpm build-tsc

echo "Coping package.json of back, shared, and libs for prod..."
# root package.json
cp ../package.json build/package.json
cp ../pnpm-lock.yaml build/pnpm-lock.yaml
cp ../pnpm-workspace.yaml build/pnpm-workspace.yaml
cp ../.env build/back/.env

# back package.json
cp package.json build/back/package.json

# dependencies package.json
cp ../shared/package.json build/shared/package.json
cp ../libs/http-client/package.json build/libs/http-client/package.json
cp ../libs/html-templates/package.json build/libs/html-templates/package.json

# remove precommit from root package.json
sed -i "" -e "/prepare/d" ../package.json

# change dependencies to use js instead of ts
sed -i "" -e "/\"types\": \"src\/index.ts\"/d" build/libs/http-client/package.json
sed -i "" -e "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/" build/libs/http-client/package.json
sed -i "" -e "/\"types\": \"src\/index.ts\"/d" build/libs/html-templates/package.json
sed -i "" -e "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/"  build/libs/html-templates/package.json
sed -i "" -e "/\"types\": \"src\/index.ts\"/d" build/shared/package.json
sed -i "" -e "s/\"main\": \"src\/index.ts\"/\"main\": \"src\/index.js\"/"  build/shared/package.json

echo "web: cd back && pnpm prod-tsc\npostdeploy: cd back && pnpm migrate-prod" > build/Procfile

echo "Making tar.gz from transpiled code"

chmod -R 755 build

tar -czvf back-build.tar.gz build