import db from "../index.js";
import klaviyoQueue from "../utils/klaviyoDataSubmission.js";
import { sendMailQueue, sendAutoMailQueue } from "../utils/mailJobScheduler.js";
import { shopifyDataQueue } from "../utils/shopifyData.js";
import { connection } from "../server.js";
import { sendThankyouMailQueue } from "../utils/sendProductAvailableMailQueue.js";
export let formIds;
// Create submission

const getNotifySmtpSettings = async (shop) => {
  try {
    console.log("SHOPNAME",shop)
    const sql = `SELECT notifysmtpSetting FROM shopify_sessions WHERE shop = ?`;
    const [result] = await db.sequelize.query(sql, {
      replacements: [shop],
    });

    const notifySmtpSetting = JSON.parse(result[0]?.notifysmtpSetting || '{}');
    return notifySmtpSetting;
  } catch (error) {
    console.error('Error fetching Notify SMTP settings:', error);
    throw error;
  }
};
export const createSubmission = async (req, res) => {
  try {
    const {
      recaptchaToken,
      recaptchaEnabled,
      adminMailSettings,
      klaviyoSettings,
      formFields,
      isDuplicate,
      status,
      notifyFormStatus,
      productid,
      productAvailable,
      autoResponseSettings,
      shopifySettings,
      ...data
    } = req.body;
    console.log("25",data,productid)
    formIds = data.formId;
    const { enable: adminMailEnable, ...emailData } = adminMailSettings;
    const { autoenable: autoMailEnable, ...autoemailData } = autoResponseSettings;
    const {enable: klaviyoEnable, listMethod, hiddenField, defaultOption } = klaviyoSettings;
    const hasEmailType = formFields.some((field) => field.type === "email");
    const shopifyEnable = shopifySettings.createenable;
    let shopnames = data.shopname;
    
    let result;
    try {
      const { formtitle, fields, shopname, ...extractedData } = data;
      console.log("36",status,notifyFormStatus)
      if(!notifyFormStatus){  
	console.log(fields);
      const resultObj = { ...extractedData };
      for (const key in fields) {
        if (Object.hasOwnProperty.call(fields, key)) {
          resultObj[key] = fields[key];
        }
      }
      // Generate the INSERT INTO query
      let insertQuery = `INSERT INTO \`${formtitle}\` (`;

      // Add column names from the JSON object
      insertQuery += Object.keys(resultObj)
        .map((key) => `\`${key}\``)
        .join(", ");

      insertQuery += ") VALUES (";

      // Add values from the JSON object
      insertQuery += Object.values(resultObj)
        .map((value) => {
          if (Array.isArray(value)) {
            const serializedString = value.join(",");
            return `'${serializedString}'`;
          } else if (typeof value === "string") {
            return`'${value}'`;
          } else if (typeof value === "number") {
            return`${value}`;
          } else if (typeof value === 'boolean') {
            return `${value}`;
          } else if (!value) {
            return "null";
          }
          return value;
        })
        .join(", ");

      insertQuery += ")";

      // console.log(insertQuery)
      // Execute the query
      connection.query(insertQuery, (error, results) => {
        if (error) {
          console.log(error)
          throw new Error(error);
        } else {
          console.log("Submissions created successfully", results.insertId);
          res.status(200).send(results);
        }
      });
    }else {
      console.log(formFields)
        // Extracting field names and values from the 'fields' object
        const fieldNames = Object.keys(fields);
        const fieldValues = Object.values(fields);
      
        // Create an array to hold the dynamic column definitions and types
        const dynamicColumnDefs = [];
        const thankyouemailstatus = "pending";
        const instockstatus = "pending";
        // let requested = false;
        // Define a function to map 'type' to the corresponding MySQL data type
        const mapTypeToMySQLDataType = (type) => {
          switch (type) {
            case "text":
              return "TEXT";
            case "textarea":
              return "LONGTEXT";
            case "email":
              return "VARCHAR(255)";
            // Add more cases for other supported types, or use a default case for "TEXT"
            default:
              return "TEXT";
          }
        };
      
// Loop through the 'formFields' array and add column definitions with their data types
formFields.forEach((field) => {
  if (field.type != 'hidden') {
    const fieldName = field.type === 'email' ? 'email' : field.label.replace(/\s/g, '_');
    const dataType = field.type === 'email' ? 'VARCHAR(255)' : mapTypeToMySQLDataType(field.type);
    dynamicColumnDefs.push(`\`${fieldName}\` ${dataType}`);
  }
});

// Add the 'email' column to the dynamic column definitions
const emailColumnName = "email";
dynamicColumnDefs.push(`\`${emailColumnName}\` VARCHAR(255)`);

// Add createdAt and updatedAt columns to the dynamic column definitions
dynamicColumnDefs.push("`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP");
dynamicColumnDefs.push("`updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

const hiddenFields = formFields.filter((field) => field.type == "hidden");

hiddenFields.forEach((field) => {
  console.log("150",field.value)
  field.value.forEach((hiddenField)=>{
    const fieldName = hiddenField.label.replace(/\s/g, '_'); // Replace spaces with underscores for column names
    const dataType = "VARCHAR(255)"; // Use your desired data type for hidden fields
    dynamicColumnDefs.push(`\`${fieldName}\` ${dataType}`);
  })
});
// Generate the ALTER TABLE query to add the dynamic columns if they don't exist
const alterTableQuery = `ALTER TABLE notifyforms ADD IF NOT EXISTS (${dynamicColumnDefs.join(", ")})`;

        // Execute the ALTER TABLE query to add the dynamic columns
        connection.query(alterTableQuery, (alterError) => {
          if (alterError) {
            console.log(alterError);
            throw new Error(alterError);
          } else {
                // Check if the email field exists in the submitted data
    const emailField = formFields.find((field) => field.type == "email");
    if (!emailField) {
      throw new Error("Email field not found in formFields");
    }
console.log('138',emailField)
    const emailValue = fields[emailField.label];
    const filteredFieldNames = fieldNames.filter((fieldName) => fieldName !== emailField.label);
const filteredFieldValues = fieldValues.filter((value, index) => fieldNames[index] !== emailField.label);

console.log('140',emailValue)
    // Check if the email already exists in the database
    connection.query(
      `SELECT * FROM notifyforms WHERE email = ?`,
      [emailValue],
      async (error, results) => {
        if (error) {
          console.log(error);
          throw new Error(error);
        } else {
          if (results.length > 0) {
            const existingCustomerData = results[0];
console.log('data',existingCustomerData)
            const existingProductIdJson = JSON.parse(existingCustomerData.productId);
console.log("idjson",existingProductIdJson)
            // Check if the productId already exists in the JSON
            const existingProductId = existingProductIdJson.find((item) => item.id == productid);
    		console.log("e",existingProductId)
let existingProductAvailable = false;
let existingProductStatus = '';
  if (existingProductId){
   existingProductAvailable = existingProductId.productAvailable == 'false';
    existingProductStatus = existingProductId.thankyouemailresponsestatus == 'Sent';
            if (existingProductAvailable && existingProductStatus  ) {
              console.log("Product ID already exists for this customer");
              res.status(500).json({ error: "Product ID already exists for this customer" });
            } 
            else{
              const notifySmtpSettings = await getNotifySmtpSettings(shopname);

              // Update the customer's record in the database with the updated productId JSON
              connection.query
              (
                `UPDATE notifyforms SET productId = ? WHERE email = ?`,
                [JSON.stringify(existingProductIdJson), emailValue],
                async (updateError, updateResults) => {
                  if (updateError) {
                    console.log(updateError);
                    throw new Error(updateError);
                  } else {
                    console.log("Product information updated successfully", updateResults.insertId);
                    // Send thank you email and update status
                    const emailData = {
                      email: emailValue,
                      shopname: shopname,
                      productId: existingProductIdJson,
                      notifySmtpSetting: notifySmtpSettings,
                      fields: fields,
                      formfields: formFields,
                    };
                    console.log("Submissions created successfully", updateResults.insertId);
                    await sendThankyouMailQueue.add(emailData);    
                    res.status(200).send(updateResults);    
            }
          })
        }
      }    	    
            else {
              const notifySmtpSettings = await getNotifySmtpSettings(shopname);
              // Add the new productId to the existing JSON

              existingProductIdJson.push({
                id: productid,
                createdAt: new Date(),
                productAvailable: productAvailable,
                thankyouemailresponsestatus: "pending",
                instockresponsestatus: "pending",
              });
    
              // Update the customer's record in the database with the updated productId JSON
              connection.query(
                `UPDATE notifyforms SET productId = ? WHERE email = ?`,
                [JSON.stringify(existingProductIdJson), emailValue],
                (updateError, updateResults) => {
                  if (updateError) {
                    console.log(updateError);
                    throw new Error(updateError);
                  } else {
                    console.log("Product information added successfully", updateResults.insertId);
                    res.status(200).json({ message: "Product information added successfully" });
                  }
                }
              );
              const emailData = {
                email: emailValue,
                shopname: shopname,
                productId: existingProductIdJson, // Include the existing product information here
                notifySmtpSetting: notifySmtpSettings,
                fields: fields,
                formfields: formFields,
              }
              await sendThankyouMailQueue.add(emailData);
            }
          } else {
            // If the email does not exist, create a new customer entry
            const serializedProductId = JSON.stringify([
              {
                id: productid,
                createdAt: new Date(),
                productAvailable: productAvailable,
                thankyouemailresponsestatus: "pending",
                instockresponsestatus: "pending",
              },
            ]);

// Add the 'email' column and its value separately
filteredFieldNames.push(emailColumnName);
filteredFieldValues.push(emailValue);

// Add the serialized 'productId' column and its value separately
filteredFieldNames.push("productId");
filteredFieldValues.push(serializedProductId);


const placeholders = filteredFieldValues.map(() => "?").join(", ");
// Construct the insert query using the filteredFieldNames and placeholders
const insertQuery = `INSERT INTO notifyforms (shopname,formid, \`${filteredFieldNames.join('`, `')}\`, createdAt, updatedAt) VALUES (?,?, ${placeholders}, NOW(), NOW())`;

console.log(insertQuery)
// Combine 'formid', other field values, 'email' value, and serialized 'productId' in an array for the query execution
const queryData = [shopname,data.formId, ...filteredFieldValues];

// Execute the query
            connection.query(insertQuery, queryData, async (insertError, insertResults) => {
              if (insertError) {
                console.log(insertError);
                throw new Error(insertError);
              } else {
                const notifySmtpSettings = await getNotifySmtpSettings(shopname);
                const emailData = {
                  email: emailValue, // Replace this with the email address of the customer
                  shopname:shopname,
                  productId: [
                    {
                      id: productid,
                      createdAt: new Date(),
                      productAvailable: productAvailable,
                      thankyouemailresponsestatus: "pending",
                      instockresponsestatus: "pending",
                    },
                  ],
                  notifySmtpSetting: notifySmtpSettings,
                  fields:fields,
                  formfields:formFields
                  }
                  console.log("Submissions created successfully", insertResults.insertId);
                  await sendThankyouMailQueue.add(emailData);
                res.status(200).send(insertResults);
              }
            });
            
          }
        }
      });
  }
      });
    }
  }
    catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Internal Server Error, Please try again later." });
      return;
    }

    // if merchant has enabled the autoResponseMail option this code will execute
    autoemailData.jsonData = data;
    if (autoMailEnable) {
      let emailObj;
      const sql = `SELECT smtpSetting FROM shopify_sessions WHERE shop = ?`;
      const promise = new Promise((resolve, reject) => {
        connection.query(sql, [shopnames], function (err, result) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            emailObj = JSON.parse(result[0].smtpSetting);
            resolve(emailObj);
          }
        });
      });

      promise
        .then((emailObj) => {
          autoemailData.maildata = emailObj;
          sendAutoMailQueue.add(autoemailData);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    // if merchant has enabled the adminMail option this code will execute
    emailData.jsonData = data;
    if (adminMailEnable) {
      let emailObj;

      const sql = `SELECT smtpSetting FROM shopify_sessions WHERE shop = ?`;
      const promise = new Promise((resolve, reject) => {
        connection.query(sql, [shopnames], function (err, result) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            emailObj = JSON.parse(result[0].smtpSetting);
            resolve(emailObj);
          }
        });
      });

      promise
        .then((emailObj) => {
          emailData.maildata = emailObj;
          sendMailQueue.add(emailData);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    // if merchant has enabled the klaviyo option this code will execute
    if (klaviyoEnable && hasEmailType) {
      const jobData = {
        data: data,
        listMethod,
        hiddenField,
        defaultOption
      };
      klaviyoQueue.add(jobData);
     }


    if(shopifyEnable){
      const jobData = {
        data: data,
        shopifySettings,
        formFields
      };
      shopifyDataQueue.add(jobData);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const formtitle = req.params.formtitle;
    const query = `
      SELECT submissions.* 
      FROM \`${formtitle}\` as submissions
      INNER JOIN forms ON submissions.formId = forms.id
      WHERE forms.notifyformstatus = 0;
    `;
    const result = await db.sequelize.query(query);
    res.status(200).json({ data: result[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};


