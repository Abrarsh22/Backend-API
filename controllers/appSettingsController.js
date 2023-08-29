import db from '../index.js';
import fetch from 'node-fetch';
import axios from 'axios';
import multer from 'multer';
import xlsx from 'xlsx';
import mysql from 'mysql2/promise';
import fs from 'fs';
// MySQL database connection configuration
const dbconfig = {
 host: "localhost",
  user: "formdbstageuser",
  password: "U49npW7jn^eW",
  database: "formdb_stage",
};
const upload = multer(); 
export const smtpSetting = async (req, res) => {
  try {
    const { smtpSetting, shop } = req.body;
    const sql = `UPDATE shopify_sessions SET smtpSetting = ? WHERE shop = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [JSON.stringify(smtpSetting), shop],
    });

    console.log("SmtpSetting has been updated");
    res.status(201).send({ "Data Stored!": result });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export const recaptchaSetting = async (req, res) => {
  try {
    const { recaptchaSetting, shop } = req.body;
    const sql = `UPDATE shopify_sessions SET recaptchaSetting = ? WHERE shop = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [JSON.stringify(recaptchaSetting), shop],
    });

    console.log("recaptchaSetting has been updated");
    res.status(201).send({ "Data Stored!": result });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export const klaviyoSetting = async (req, res) => {
  try {
    const { klaviyoSetting, shop } = req.body;
    const sql = `UPDATE shopify_sessions SET klaviyoSetting = ? WHERE shop = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [JSON.stringify(klaviyoSetting), shop],
    });

    console.log("klaviyoSetting has been updated");
    res.status(201).send({ "Data Stored!": result });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export const getShopifySession = async (req, res) => {
  try {
    const shop = req.query.shop;
    const sql = `SELECT smtpSetting, recaptchaSetting, klaviyoSetting,notifysmtpSetting,notifythankyouemailResponse FROM shopify_sessions WHERE shop = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [shop],
    });

    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export const notifysmtpSetting = async (req, res) => {
  try {
    console.log(req.body);
    const { notifysmtpSetting, shop } = req.body;
    const sql = `UPDATE shopify_sessions SET notifysmtpSetting = ? WHERE shop = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [JSON.stringify(notifysmtpSetting), shop],
    });

    console.log("notifySmtpSetting has been updated");
    res.status(201).send({ "Data Stored!": result });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
export const updateNotifyEmailSettings = async (req, res) => {
  try {
    console.log(req.body);
    const { notifythankyouemailResponse, shop } = req.body;
    const sql = `UPDATE shopify_sessions SET notifythankyouemailResponse = ? WHERE shop = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [JSON.stringify(notifythankyouemailResponse), shop],
    });

    console.log("notifythankyouemailResponse has been updated");
    res.status(201).send({ "Data Stored!": result });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
export const updateNotifyInStockEmailSettings = async (req, res) => {
  try {
    console.log(req.body);
    const { notifyInstockemailResponse, shop } = req.body;
    const sql = `UPDATE shopify_sessions SET notifyInStockEmailResponseSettings = ? WHERE shop = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [JSON.stringify(notifyInstockemailResponse), shop],
    });

    console.log("notifyInstockemailResponse has been updated");
    res.status(201).send({ "Data Stored!": result });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
// export const saveNotifyForm = async (req, res) => {
//   try {
//     const formSettings = req.body;
//     const shopname = formSettings.shopname;
//     console.log(shopname)

//     const existingSettings = await NotifyFormSettings.findOne({ where: { shopname } });

//     if (existingSettings) {
//       // If an existing entry is found, update its settings
//       await existingSettings.update(formSettings);

//       res.status(200).json({ message: 'Form settings updated successfully!' });
//     } else {
//       // If no existing entry is found, create a new one
//       const createdSettings = await NotifyFormSettings.create(formSettings);

//       res.status(201).json(createdSettings);
//     }
//   } catch (error) {
//     console.log('Error saving form settings:', error);
//     res.status(500).json({ error: 'Error saving form settings' });
//   }
// };

// export const getNotifyForm = async (req,res)=>{
//   try {
//     const formSettings = await NotifyFormSettings.findAll();
//     console.log(formSettings.length)
//     res.status(200).json(formSettings);
//   } catch (error) {
//     console.error("Error fetching customers:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }
const snippetTemplate = `
<style>
#notifymodal
{
  display: none;
  position: fixed;
  z-index: 999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
}

#collection-modal-content {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.close-button-container {
  position: absolute;
  top: 10px;
  right: 10px;
}

.productDetails{
  display:none
}
.formbuilder-form{
  max-height:100% !important;
}
.form-container {
  width: 100%;
  max-width: 600px; /* Set the desired form width */
  margin: 0 auto; /* Center the form horizontally */
  background-color: #ffffff;
  border: 1.5px solid #000000;
  max-height: 100%;
  overflow-y: scroll;
  position: relative;
}
#form-elements-container{
  position:relative
}
.close-button-container{
  position:absolute;
  top:2px;
  right:0;
  padding:5px;
}
#collection-close-button{
  color: grey;
    font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  width: 25px;
  height: auto;
  text-align: center;
  padding: 10px;
  position: relative;
  top: -1px;
  z-index: 999; 
}

#collection-close-button:hover {
color: #ddab24;
}
</style>

  <div class="notify-modal" id="notifymodal" >
  <div id="collection-modal-content">
  <div class="productDetails">
  <h4 class="ptitle">{{ product.title }}</h4>
  <h4 class="pid">{{ product.id }}</h4>
  <h4 class="pavailability">{{ product.available }}</h4>
  </div>
  <div id="form-elements-container">
  <div class="close-button-container">
  <span id="collection-close-button">X</span>
</div>
  <!-- The container for form elements populated dynamically -->
  </div>
  </div>
  </div>
  
<script>
document.addEventListener("DOMContentLoaded", function () {
  var notifymodal= document.getElementById("notifymodal");
console.log("MODAL",notifymodal);
  var notifyButton = document.querySelectorAll(".outstockbtn");
console.log("BUTTONNNNNN",notifyButton);
    var closeButton = document.querySelector("#collection-close-button");
    var rfbForm = document.querySelector(".formbuilder-form"); // Use .formbuilder-form
    notifyButton.forEach(btn => {
    	btn.addEventListener('click', () => {
		console.log("CLICKED=============>>>>>>>>>>>>>");
       		notifymodal.style.display = "flex"; 

  });
});
closeButton.addEventListener('click', () => {
      notifymodal.style.display = 'none';
	window.location.reload();
    });

    window.addEventListener('click', (e) => {
      if (e.target == notifymodal) {
        notifymodal.style.display = 'none';
      }
    });
});
</script>`;

const getNotifyFormIdFromDatabase = async (shopname) => {
  try {
    const sql = `SELECT id FROM forms WHERE notifyFormStatus = 1 AND shopname = ?`;

    const [result] = await db.sequelize.query(sql, {
      replacements: [shopname],
    });

    if (result && result[0] && result[0].id) {
      const notifyId = result[0].id;
      return notifyId;
    } else {
      throw new Error("Notify form ID not found in the database.");
    }
  } catch (error) {
    console.error("Error fetching notify form ID from the database:", error);
    throw error;
  }
};

export const createSnippet = async (req, res) => {
  console.log(req.query.shopname);
  let shopname = req.query.shopname;
  console.log('UPDATING SNIPPET');
  const sql = `SELECT accessToken FROM shopify_sessions WHERE shop = ?`;

  const [accessTokenObj] = await db.sequelize.query(sql, {
    replacements: [shopname],
  });
  const accessToken = accessTokenObj[0].accessToken;
  
  const shopDomain = shopname;
  try {
    // Fetch notifyId from the database
    const notifyId = await getNotifyFormIdFromDatabase(shopname);

    let formElements = '';
    formElements += `<div id="rfb-${notifyId}"></div>`;

    const snippetContent = snippetTemplate.replace(
      '<!-- The container for form elements populated dynamically -->',
      formElements
    );

    // Fetch all themes for the given shop
    const themesResponse = await fetch(`https://${shopDomain}/admin/api/2023-01/themes.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (themesResponse.ok) {
      const themesData = await themesResponse.json();
      const themes = themesData.themes;
      // Loop through each theme and create/update the snippet
      for (const theme of themes) {
        const themeId = theme.id;
        const assetKeys = 'snippets/notify-modal.liquid';

        const existingSnippetResponse = await fetch(
          `https://${shopDomain}/admin/api/2023-01/themes/${themeId}/assets.json?asset[key]=${assetKeys}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
            },
          }
        );

        if (existingSnippetResponse.ok) {
          const existingSnippetData = await existingSnippetResponse.json();

          // If the snippet exists, do not update it
          if (existingSnippetData.asset) {
            const assetVersion = parseInt(existingSnippetData.asset.version, 10) + 1;
            const assetUrl = `https://${shopDomain}/admin/api/2023-01/themes/${themeId}/assets.json`;
            const assetKey = 'snippets/notify-modal.liquid';
            const response = await fetch(assetUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
              },
              body: JSON.stringify({
                asset: {
                  key: assetKey,
                  value: snippetContent,
                  version: assetVersion,
                },
              }),
            });
            if (!response.ok) {
              throw new Error('Error creating or updating snippet');
            }

            const data = await response.json();
            // console.log('Snippet created or updated in theme:');
          }
        }
      }
    }
    else{
      console.log('error')
    }
  } catch (error) {
    console.error('Error creating or updating snippet:', error);
  }
};

 const serverEndpoint = 'https://shopify-formapp-apis-dev.dtengg.com/api/forms/update-product-details';
const webhookExists = async (shopifyStoreUrl,accessToken) => {
  try {
    const response = await axios.get(
      `https://${shopifyStoreUrl}/admin/api/2023-07/webhooks.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      }
    );

    const webhooks = response.data.webhooks;
    // console.log(webhooks)
    for (const webhook of webhooks) {
      if (webhook.address === serverEndpoint && webhook.topic === 'products/update') {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking webhooks:', error.response.data);
    return false;
  }
};
export const createWebhook = async (req,res) => {
  let shopname = req.query.shopname;
  const sql = `SELECT accessToken FROM shopify_sessions WHERE shop = ?`;

  const [accessTokenObj] = await db.sequelize.query(sql, {
    replacements: [shopname],
  });
  const accessToken = accessTokenObj[0].accessToken;
  const shopifyStoreUrl = shopname;

  try {
    const webhookAlreadyExists = await webhookExists(shopifyStoreUrl,accessToken);
    if (webhookAlreadyExists) {
       console.log('Webhook already exists. Skipping creation.');
      return;
    }

    const webhookUrl = `${serverEndpoint}`;
    const webhookTopic = 'products/update';

    const response = await axios.post(
      `https://${shopifyStoreUrl}/admin/api/2023-07/webhooks.json`,
      {
        webhook: {
          topic: webhookTopic,
          address: webhookUrl,
          format: 'json'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      }
    );

    console.log('Webhook created successfully:',);
  } catch (error) {
    console.error('Error creating webhook:', error);
  }
};

const extractURLFromFormula = formula => {
  const regex = /"([^"]+)"/;
  const matches = formula.match(regex);
  if (matches && matches.length >= 2) {
    return matches[1];
  }
  return '';
};
const extractVariantIdFromURL = link => {
  // console.log('link',link)
const parsedUrl = new URL(link);
return parsedUrl.searchParams.get('variant');
};
export const pushDatainDB = (req, res) => {
  upload.single('csvFile')(req, res, async (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(500).json({ error: 'Error uploading file' });
    }

    try {
      const uploadedFilePath = 'uploadedFile.xlsx';
      fs.writeFileSync(uploadedFilePath, req.file.buffer);
  
      // Read the uploaded XLSX file
      const workbook = xlsx.readFile(uploadedFilePath);
      const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const range = xlsx.utils.decode_range(sheet['!ref']);

const columnNames = [];
const sheetData = [];

// Extract header row for column names
for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
  const col = xlsx.utils.encode_col(colIndex);
  const cellAddress = col + xlsx.utils.encode_row(range.s.r);
  const cell = sheet[cellAddress];
  const columnName = cell ? cell.v : '';
  columnNames.push(columnName);
}

// Extract data rows
for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
  const row = xlsx.utils.encode_row(rowIndex);
  const rowData = {};
  for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
    const col = xlsx.utils.encode_col(colIndex);
    const cellAddress = col + row;
    const cell = sheet[cellAddress];
    const cellValue = cell ? cell.v : undefined;
    const cellFormula = cell && cell.f ? cell.f : '';

    // Map column index to column name
    const columnName = columnNames[colIndex];
    
    // Handle 'Product' column with formula
    if (columnName === 'Product') {
      const productURL = extractURLFromFormula(cellFormula);
      rowData[columnName] = productURL;
    } else {
      rowData[columnName] = cellValue;
    }
  }
  sheetData.push(rowData);
}
const convertRowToJSON = row => {
  // console.log("ROW",row)
  const availableQuantity = row['Available quantity'];
  const productAvailableColumn = row['productAvailable'];
  let productAvailable = '';
let productURL,variantId;
console.log(availableQuantity,productAvailableColumn)
  if (availableQuantity == undefined) { 
    productAvailable = productAvailableColumn == false ? 'false' : 'true';
  } else {
    productAvailable = availableQuantity <= 0 ? 'false' : 'true';
  }
  if(row['Product']){
    productURL = row['Product'].toString();
    variantId = extractVariantIdFromURL(productURL);
  }

  const productObject = {
    id: variantId || row.productId,
    createdAt: row['Subscribed date'] || row['createdAt'],
    productAvailable: productAvailable ,
    thankyouemailresponsestatus: row.thankyouemailresponsestatus || 'pending', //Not in CSV
    instockresponsestatus: row.instockresponsestatus || 'pending',
  };
const productJSON = JSON.stringify([productObject]);
  return {
    shopname: row['shopname'] || 'thespiritsembassy-stagging.myshopify.com', //Not in CSV
    formid: row['formid'] || '074058c6-8254-4b06-bde6-32b24be78619',  //Not in csv
    productId: productJSON, // Store as an array of objects
    createdat: row['Subscribed date'] || row['createdAt'],
    updatedat: row['Last Sent'] || row['Subscribed date'] || row['updatedAt'], //Not in csv
    email: row['email'] || row['Customer email'] ,
    };
};

const jsonData = sheetData.map(convertRowToJSON);

// Create a MySQL connection
const connection = await mysql.createConnection(dbconfig);

// Loop through jsonData and update productId based on email match
for (const data of jsonData) {
  // Query to check if email exists in the database
  const emailExistsQuery = 'SELECT productId FROM notifyforms WHERE email = ?';
  const [existingData] = await connection.query(emailExistsQuery, [data.email]);

  if (existingData.length > 0) {
    // Email exists, update productId array
    const existingProductIdArray = JSON.parse(existingData[0].productId);

    const newProductId = JSON.parse(data.productId)[0];
    const newProductIdValue = newProductId.id;

    // Check if the new product ID already exists for the email
    const existingProductIdIndex = existingProductIdArray.findIndex(product => product.id === newProductIdValue);

    if (existingProductIdIndex === -1) {
      // Product ID is not present, add it to the array
      existingProductIdArray.push(newProductId);
      data.productId = JSON.stringify(existingProductIdArray);

      // Update the productId column in the database
      const updateProductIdQuery = 'UPDATE notifyforms SET productId = ? WHERE email = ?';
      await connection.query(updateProductIdQuery, [data.productId, data.email]);
    }
  }

  // If email doesn't exist, insert new data
  else {
    const insertQuery = 'INSERT INTO notifyforms SET ?';
    await connection.query(insertQuery, data);
  }
}

// Close the connection
await connection.end();

console.log('Data inserted/updated in MySQL database.');
res.status(200).json({ message: 'File uploaded and data inserted/updated in the database.' });
}  catch (error) {
   console.error('Error processing file and inserting/updating data:', error);
   res.status(500).json({ error: 'Error processing file and inserting/updating data' });
 }
  });
};