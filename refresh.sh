rm -rf database.sqlite
npx sequelize db:migrate
npx sequelize db:seed:all
