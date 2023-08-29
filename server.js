import express from 'express';
import cors from 'cors';
import router from './router/router.js';
import mysql from "mysql2";
import { updateProductDetailsInDB } from './controllers/formController.js';
export const connection = mysql.createConnection({
  host: "localhost",
  user: "formdbstageuser",
  password: "U49npW7jn^eW",
  database: "formdb_stage",
});

//Initialize
const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// routers
app.use('/api/forms', router);

// server response route
app.get('/', (req, res) => {
  res.status(200).send('Server is running fine');
});

app.post('/api/forms/update-product-details', async (req, res) => {
  try {
console.log(req.body);
    const shopUrl = req.headers['x-shopify-shop-domain'];
    console.log("39",shopUrl)
  
    await updateProductDetailsInDB(req.body,shopUrl);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating product details in the database:', error);
    res.sendStatus(500);
  }
});

//port
const PORT = process.env.PORT || 6000;

//server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
