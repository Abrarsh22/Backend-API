import { Sequelize, DataTypes } from 'sequelize';
import FormModel from './models/formModel.js';
import notifyModel from './models/notifyModel.js';

const sequelize = new Sequelize(
  'formdb_stage',
  'formdbstageuser',
  'U49npW7jn^eW', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,

    pool: {
      max: 100, // Increase the maximum number of connections
      min: 10, // Increase the minimum number of connections
      acquire: 30000,
      idle: 10000
    }
  }
);


sequelize.authenticate()
  .then(() => {
    console.log('formdb connected..');
  })
  .catch(err => {
    console.log('Error' + err);
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.forms = FormModel(sequelize, DataTypes);
db.notifyforms = notifyModel(sequelize,DataTypes);


db.sequelize.sync({ force: false })
  .then(() => {
    console.log('yes re-sync done!');
  });

export default db;
