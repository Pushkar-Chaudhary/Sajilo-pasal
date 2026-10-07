const app = require('./src/app');
require('dotenv').config();
const connectDB = require('./src/config/db');

connectDB().then(() => {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
});