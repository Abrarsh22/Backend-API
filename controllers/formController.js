import db from "../index.js";
import moment from "moment";
import fetch from "node-fetch";
import { Sequelize } from "sequelize";
import  {sendProductAvailableMailQueue,sendThankyouMailQueue}  from "../utils/sendProductAvailableMailQueue.js";

const Form = db.forms;
const NotifyForm = db.notifyforms;
// Create form
export const createForm = async (req, res) => {
  const transaction = await db.sequelize.transaction(); // Start a transaction

  try {
    const {
      id,
      formtitle,
      shopname,
      shortcode,
      componentJSON,
      headerJSON,
      footerJSON,
      afterSubmit,
      formSettings,
      status,
      notifyFormStatus,
      klaviyoIntegration,
      formCSS,
      shopifyIntegration,
    } = req.body;

    const info = {
      id,
      formtitle,
      shopname,
      shortcode,
      componentJSON,
      headerJSON,
      footerJSON,
      afterSubmit,
      formSettings,
      status,
      notifyFormStatus,
      klaviyoIntegration,
      formCSS,
      shopifyIntegration,
    };

    // Create a table query
    let createTableQuery = `CREATE TABLE \`${formtitle}\` (`;
    createTableQuery += "id INT PRIMARY KEY AUTO_INCREMENT, ";

    // Add columns based on the JSON array values
    for (let i = 0; i < componentJSON.length; i++) {
      const { type, label, value, datatype } = componentJSON[i];
      if (type !== "html" && type !== "hidden") {
        createTableQuery += `\`${label}\` ${datatype}, `;
      } else if (type === "hidden") {
        value.map(({ label, datatype }) => {
          createTableQuery += `\`${label}\` ${datatype}, `;
        });
      } else {
      }
    }

    // Remove the trailing comma and space
    createTableQuery = createTableQuery.slice(0, -2);
    // Add additional columns
    createTableQuery += `, formId VARCHAR(255))`;

    console.log(createTableQuery);

    // Execute the query using Sequelize
    await db.sequelize.query(createTableQuery, { transaction });

    // Create a record in the "forms" table
    const form = await Form.create(info, { transaction });

    await transaction.commit(); // Commit the transaction

    console.log("Table and form created successfully");
    res.status(200).send(form);
  } catch (error) {
    await transaction.rollback(); // Rollback the transaction if an error occurs
    error.message = error.message.replace("Table", "Form");
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get all forms
export const getForms = async (req, res) => {
  try {
    const forms = await Form.findAll({
      where: {
        shopname: req.params.shopname,
      },
    });
    if (forms) {
      const formattedData = forms.map((form) => {
        const createdAt = moment(form.createdAt).format("DD MMM YYYY h:mm a");
        const updatedAt = moment(form.updatedAt).format("DD MMM YYYY h:mm a");
        return {
          ...form.dataValues,
          createdAt,
          updatedAt,
        };
      });
      res.status(200).json({
        forms: formattedData,
      });
    } else {
      res.status(400).json({
        error: `Form table is empty!`,
      });
    }
  } catch (error) {
    res.status(400).json({ error: error });
  }
};
export const getFormsExceptNotifyForm = async (req, res) => {
  try {
    const forms = await Form.findAll({
      where: {
        shopname: req.params.shopname,
        notifyFormStatus:0
      },
    });
    if (forms) {
      const formattedData = forms.map((form) => {
        const createdAt = moment(form.createdAt).format("DD MMM YYYY h:mm a");
        const updatedAt = moment(form.updatedAt).format("DD MMM YYYY h:mm a");
        return {
          ...form.dataValues,
          createdAt,
          updatedAt,
        };
      });
      res.status(200).json({
        forms: formattedData,
      });
    } else {
      res.status(400).json({
        error: `Form table is empty!`,
      });
    }
  } catch (error) {
    res.status(400).json({ error: error });
  }
};
export const getNotifyForm = async (req, res) => {
  try {
    const forms = await Form.findAll({
      where: {
        shopname: req.params.shopname,
        notifyFormStatus:1
      },
    });
    if (forms) {
      const formattedData = forms.map((form) => {
        const createdAt = moment(form.createdAt).format("DD MMM YYYY h:mm a");
        const updatedAt = moment(form.updatedAt).format("DD MMM YYYY h:mm a");
        return {
          ...form.dataValues,
          createdAt,
          updatedAt,
        };
      });
      res.status(200).json({
        forms: formattedData,
      });
    } else {
      res.status(400).json({
        error: `Form table is empty!`,
      });
    }
  } catch (error) {
    res.status(400).json({ error: error });
  }
};
// Get form by id
export const getForm = async (req, res) => {
  try {
    const form = await Form.findOne({
      where: {
        id: req.id,
      },
    });
    if (form) {
      res.status(200).json({
        forms: form,
      });
    } else {
      res.status(400).json({
        error: `No form was found with the given ID: ${req.id}. Please provide a valid ID to fetch the form.`,
      });
    }
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

// Delete Form
export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findOne({
      where: {
        id: req.id,
      },
    });

    if (form) {
      await Form.destroy({ where: { id: req.id } });
      res.status(200).send("Form is deleted !");
    } else {
      res.status(400).json({
        forms: `No form was found with the given ID: ${req.id}. Please provide a valid ID to fetch the form.`,
      });
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

// update form
export const updateform = async (req, res) => {
  console.log(
    `-------------------- ${req.body.formtitle} Form Update has been started ------------------`
  );
  const {
    formtitle,
    componentJSON,
    headerJSON,
    footerJSON,
    status,
    notifyFormStatus,
    formCSS,
    afterSubmit,
    klaviyoIntegration,
    formSettings,
    shopifyIntegration,
  } = req.body;

  let form;
  let rollbackTransactionQuery = [];
  let rollbackTableRenameQuery;
  let existingFormDetails;
  try {
    form = await Form.findOne({
      where: {
        id: req.id,
      },
      // transaction,
    });
    if (!form) {
      return res.status(400).json({ error: "Form not found" });
    }

    existingFormDetails = form.get(); // Retrieve the existing form details
    const existingFormCompJSON = JSON.parse(existingFormDetails.componentJSON);

    const updates = {};
    if ("formtitle" in req.body) {
      updates.formtitle = formtitle;
      // Step: Change the table name of the corresponding form submissions table
      const existingTableName = existingFormDetails.formtitle;
      const newTableName = formtitle;

      if (existingTableName !== newTableName) {
        const query = `ALTER TABLE \`${existingTableName}\` RENAME TO \`${newTableName}\`;`;

        try {
          await db.sequelize.query(query);
          rollbackTableRenameQuery = `ALTER TABLE \`${newTableName}\` RENAME TO \`${existingTableName}\`;`;
          console.log(
            `Table rename from ${existingTableName} to ${newTableName}.`
          );
        } catch (error) {
          throw error;
        }
      }
    }
    if ("componentJSON" in req.body) updates.componentJSON = componentJSON;
    if ("headerJSON" in req.body) updates.headerJSON = headerJSON;
    if ("footerJSON" in req.body) updates.footerJSON = footerJSON;
    if ("status" in req.body) updates.status = status;
    if ("notifyFormStatus" in req.body) updates.notifyFormStatus = notifyFormStatus;
    if ("formCSS" in req.body) updates.formCSS = formCSS;
    if ("afterSubmit" in req.body) updates.afterSubmit = afterSubmit;
    if ("klaviyoIntegration" in req.body)
      updates.klaviyoIntegration = klaviyoIntegration;
    if ("formSettings" in req.body) updates.formSettings = formSettings;
    if ("shopifyIntegration" in req.body)
      updates.shopifyIntegration = shopifyIntegration;

    // Step 1: Compare the existing form details with the updated form details and return true or false
    const formDetailsChanged = Object.keys(updates).some(
      (key) => updates[key] !== existingFormDetails[key]
    );

    // Step 2: Handle changes in form fields and corresponding form submissions table
    if (formDetailsChanged) {
      const tableName = formtitle;

      // Check for added, deleted, or re-ordered form fields
      const { componentJSON: updatedComponentJSON } = updates;

      // Identify hidden added fields
      const existingHiddenObject = existingFormCompJSON.find(
        (obj) => obj.type === "hidden"
      );
      const updatedHiddenObject = updatedComponentJSON.find(
        (obj) => obj.type === "hidden"
      );
      const EHV = existingHiddenObject ? existingHiddenObject.value : [];
      const UHV = updatedHiddenObject ? updatedHiddenObject.value : [];

      const addedHiddenFields = UHV.filter((obj) => {
        return !EHV.some((existingObj) => existingObj.value === obj.value);
      });

      // Handle addedHidden fields
      if (addedHiddenFields.length > 0) {
        for (const object of addedHiddenFields) {
          const { label, datatype } = object;
          const query = `ALTER TABLE \`${tableName}\` ADD COLUMN IF NOT EXISTS \`${label}\` ${datatype};`;
          try {
            await db.sequelize.query(query);
            console.log(`${label} column added if not exists already.`);
            rollbackTransactionQuery.push(
              `ALTER TABLE \`${tableName}\` DROP COLUMN \`${label}\`;`
            );
          } catch (error) {
            throw error;
          }
        }
      }

      // Identify added fields
      const addedFields = updatedComponentJSON
        .filter(
          (updatedField) =>
            !existingFormCompJSON.some(
              (existingField) => existingField.id === updatedField.id
            )
        )
        .filter((field) => {
          return field.type !== "html" && field.type !== "hidden";
        });

      // Identify deleted fields
      const deletedFields = existingFormCompJSON.filter(
        (existingField) =>
          !updatedComponentJSON.some(
            (updatedField) => updatedField.id === existingField.id
          )
      );

      // To remove the deleted fields label from IdentifierFieldsArray of formSettings.subUqniqueIdentifires
      formSettings.subUniqueIdentifier.IdentifierFields =
        formSettings.subUniqueIdentifier.IdentifierFields.filter((label) => {
          // Check if the label is present in the deletedFields array
          return !deletedFields.some((field) => field.label === label);
        });

      const deletedHiddenFields = EHV.filter((obj) => {
        return !UHV.some((object) => object.value === obj.value);
      });

      // To remove the deleted fields label from IdentifierFieldsArray of formSettings.subUqniqueIdentifires for hidden fields also
      formSettings.subUniqueIdentifier.IdentifierFields =
        formSettings.subUniqueIdentifier.IdentifierFields.filter((label) => {
          // Check if the label is present in the deletedHiddenFields array
          return !deletedHiddenFields.some(({ value }) => value === label);
        });

      const matchedObjects = componentJSON.map((newObj) => {
        const oldObj = existingFormCompJSON.find(
          (oldObj) => oldObj.id === newObj.id
        );
        return { oldObj, newObj };
      });

      // Identify fields whose labels are changed
      const renameMatchedObjects = matchedObjects.filter(
        ({ oldObj, newObj }) => oldObj && oldObj.label !== newObj.label
      );

      addedFields.map((obj) => console.log("Add Field", obj.label));
      deletedFields.map((obj) => console.log("Delete Field", obj.label));
      renameMatchedObjects.map(({ oldObj, newObj }) =>
        console.log("Rename Fields", oldObj.label, " to ", newObj.label)
      );

      // Update label names for existing form fields in the form submissions table
      if (renameMatchedObjects.length > 0) {
        for (const obj of renameMatchedObjects) {
          const { oldObj, newObj } = obj;
          formSettings.subUniqueIdentifier.IdentifierFields =
            formSettings.subUniqueIdentifier.IdentifierFields.map((label) => {
              if (label === oldObj.label) {
                return newObj.label;
              } else {
                return label;
              }
            });
          const query = `ALTER TABLE \`${tableName}\` CHANGE \`${oldObj.label}\` \`${newObj.label}\` ${oldObj.datatype};`;
          try {
            await db.sequelize.query(query);
            rollbackTransactionQuery.push(
              `ALTER TABLE \`${tableName}\` CHANGE \`${newObj.label}\` \`${oldObj.label}\` ${oldObj.datatype};`
            );
            console.log(
              `${oldObj.label} is renamed to ${newObj.label} successfully.`
            );
          } catch (error) {
            throw error;
          }
        }
      }

      // Step 5: Handle added fields
      if (addedFields.length > 0) {
        for (const field of addedFields) {
          const columnName = field.label;
          const query = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${field.datatype};`;
          try {
            await db.sequelize.query(query);
            console.log(`${columnName} column added successfully.`);
            rollbackTransactionQuery.push(
              `ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\`;`
            );
          } catch (error) {
            throw error;
          }
        }
      }
    }

    // Step 3: Update the form details in the "forms" table
    await form.update(updates);
    console.log("Form has been updated successfully.");
    const createdAt = moment(form.createdAt).format("DD MMM YYYY h:mm a");
    const updatedAt = moment(form.updatedAt).format("DD MMM YYYY h:mm a");
    const formattedData = { ...form.dataValues, createdAt, updatedAt };
    res.status(200).send(formattedData);
  } catch (error) {
    console.log(error);
    await form.update(existingFormDetails);
    rollbackTransactionQuery.map(async (query) => {
      console.log("rTQ", query);
      await db.sequelize.query(query);
    });
    if (rollbackTableRenameQuery) {
      console.log("rRTQ", rollbackTableRenameQuery);
      await db.sequelize.query(rollbackTableRenameQuery);
    }
    res.status(400).json({ error: error.message });
  }
};

// update form status
export const updateformStatus = async (req, res) => {
  console.log(req.body)
  console.log(
    `-------------------- ${req.body.formtitle} Form Update has been started ------------------`
  );
  let form;
  try {
    form = await Form.findOne({
      where: {
        id: req.id,
      },
      // transaction,
    });
    if (!form) {
      return res.status(400).json({ error: "Form not found" });
    }
    
    await form.update({ status: req.body.status});
    console.log("Form status has been updated successfully.");
    const createdAt = moment(form.createdAt).format("DD MMM YYYY h:mm a");
    const updatedAt = moment(form.updatedAt).format("DD MMM YYYY h:mm a");
    const formattedData = { ...form.dataValues, createdAt, updatedAt };
    res.status(200).send(formattedData);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
};
export const updatenotifyformstatus = async (req, res) => {
  console.log(req.body);
  const fields = JSON.parse(req.body.fields);
  console.log(
    `-------------------- ${req.body.formtitle} Form Update has been started ------------------`
  );

  try {
    const hasEmailField = fields.some(field => field.type == "email");
    if (!hasEmailField) {
      return res.status(400).json({ error: "Form must have an email type field to enable notifyFormStatus" });
    }
    // Step 1: Find the specific form with the received ID and get its current notifyFormStatus
    const formToUpdate = await Form.findOne({
      where: {
        id: req.id,
      },
    });

    if (!formToUpdate) {
      return res.status(400).json({ error: "Form not found" });
    }

    const currentStatus = formToUpdate.notifyFormStatus;
console.log("current",currentStatus)
    if (currentStatus == req.body.notifyFormStatus) {
      // No need to update if the status is the same
      console.log("Form notify status is already up to date.");
      const createdAt = moment(formToUpdate.createdAt).format("DD MMM YYYY h:mm a");
      const updatedAt = moment(formToUpdate.updatedAt).format("DD MMM YYYY h:mm a");
      const formattedData = { ...formToUpdate.dataValues, createdAt, updatedAt };
      return res.status(200).send(formattedData);
    }

    // Step 2: Update the form status accordingly
    if (req.body.notifyFormStatus == true) {
      // Turn on the form with the received ID
      await Form.update({ notifyFormStatus: 0 }, {
        where: {
          notifyFormStatus: 1,
        },
      });
      await formToUpdate.update({ notifyFormStatus: 1 });
    } else {
      // Turn off the form with the received ID
      await formToUpdate.update({ notifyFormStatus: 0 });
    }

    console.log("Form notify status has been updated successfully.");
    
    const createdAt = moment(formToUpdate.createdAt).format("DD MMM YYYY h:mm a");
    const updatedAt = moment(formToUpdate.updatedAt).format("DD MMM YYYY h:mm a");
    const formattedData = { ...formToUpdate.dataValues, createdAt, updatedAt };
    res.status(200).send(formattedData);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || "An error occurred" });
  }
};



const getNotifySmtpSettings = async (shopname) => {
  try {
    const sql = `SELECT notifysmtpSetting FROM shopify_sessions WHERE shop = ?`;
    const [result] = await db.sequelize.query(sql, {
      replacements: [shopname],
    });

    const notifySmtpSetting = JSON.parse(result[0]?.notifysmtpSetting || '{}');
    return notifySmtpSetting;
  } catch (error) {
    console.error('Error fetching Notify SMTP settings:', error);
    throw error;
  }
};

export const notifyCustomers = async (req, res) => {
  console.log(req.body);
  
  // const notifySmtpSetting = await getNotifySmtpSettings();
  const { name, email, productId, productTitle, productavailability } = req.body;
  let data;
  const thankyouemailstatus = "pending";
  const instockstatus = "pending";
  let requested = false;
  try {
    let existingCustomer = await NotifyForm.findOne({ where: { email } });

    if (existingCustomer) {
      // Customer with the same email already exists
      let existingProductIds = JSON.parse(existingCustomer.productId);

      // Check if the customer has already submitted the same product
      const existingProduct = existingProductIds.find((product) => product.id == productId);
      if (existingProduct) {
        // Product already submitted, show alert to the user or handle as needed
        return res.status(400).json({ error: 'Product already submitted' });
      } else {
        // Product not yet submitted, update requestCount and requested status
        // requestCount = existingCustomer.requestCount + 1;
        requested = true;
        let newProduct = {
          id: productId,
          createdAt: new Date(),
          productAvailable: productavailability,
          thankyouemailresponsestatus: thankyouemailstatus,
          instockresponsestatus: instockstatus,
          requested: requested,
        };
        let updatedProductIds = [...existingProductIds, newProduct];
        await NotifyForm.update(
          { productId: updatedProductIds, requested: requested },
          { where: { email } }
        );
        data = { name, email, productId: updatedProductIds, productTitle, productavailability };
      }
    } else {
      // Customer does not exist, create a new entry with requestCount 0
      await NotifyForm.create({
        name,
        email,
        productId: [
          {
            id: productId,
            createdAt: new Date(),
            productAvailable: productavailability,
            thankyouemailresponsestatus: thankyouemailstatus,
            instockresponsestatus: instockstatus,
            requested: requested,
          },
        ],
      });
      data = { name, email, productId: [{ id: productId, createdAt: new Date(), productAvailable: productavailability }], productTitle, productavailability };
    }

    res.status(200).json({ message: 'Notification form submitted successfully' });
    const dataWithSmtpSettings = {
      ...data,
      notifySmtpSetting,
    };
    await sendThankyouMailQueue.add(dataWithSmtpSettings);
  } catch (error) {
    console.error('Error inserting into notifyforms table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getShopifyProducts = async (pIds, shopname) => {
  console.log(shopname);
  const sql = `SELECT accessToken FROM shopify_sessions WHERE shop = ?`;
  console.log(sql);
  const [accessTokenObj] = await db.sequelize.query(sql, {
    replacements: [shopname],
  });
  console.log(accessTokenObj);
  const accessToken = accessTokenObj[0].accessToken;
  console.log(accessToken);

  let apiUrl = `https://${shopname}/admin/api/2023-04/products.json`;

  if (pIds && pIds.length > 0) {
    apiUrl += `?ids=${pIds}`;
  }

  const response = await fetch(apiUrl, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  });

  const data = await response.json();
  // console.log(data.products);
  return data.products;
};


export const updateProductDetailsInDB = async (webhook,shopname) => {
  try {
    // let shopname = 'thespiritsembassy-dev.myshopify.com'
    console.log("662",shopname)
    console.log('entered in update product details');
    const notifySmtpSetting = await getNotifySmtpSettings(shopname);

    // Extract product details from the webhook payload
    const { id, variants } = webhook;
    const variant = variants.find((v) => v.product_id == id);
    const productAvailable = variant ? variant.inventory_quantity > 0 : false;
// console.log(variant,productAvailable)
console.log(productAvailable);
    if (productAvailable) {
      // Retrieve user data from the database
      const users = await NotifyForm.findAll();
      const uniqueProductIds = new Set();
      let allPIds = [];

      for (const user of users) {
        const productIds = JSON.parse(user.productId);
        const pIds = productIds.map((product) => product.id);
        pIds.forEach((id) => uniqueProductIds.add(id));
        allPIds = Array.from(uniqueProductIds).join(",");
      }

      const updatedProducts = await getShopifyProducts(allPIds,shopname);

      const updates = updatedProducts.map(async (updatedProduct) => {
        const { id, variants } = updatedProduct;
 
        const sql = `SELECT * FROM notifyforms WHERE  
        JSON_CONTAINS(productId, '{"id": "${id}"}', '$')`;
        const [notifyForms] = await db.sequelize.query(sql);
        // console.log(notifyForms)
        // const notifyForms = await NotifyForm.findAll({
        //   where: Sequelize.literal(
        //     `JSON_CONTAINS(productId, '{"id": "${id}"}', '$')`
        //   ),
        // });
        console.log(notifyForms)
        const processedUserIds = new Set();
        const updatePromises = notifyForms.map(async (notifyForm) => {
          const productIds = JSON.parse(notifyForm.productId);
          const updatedProductIds = productIds.map((product) => {
            if (product.id == id) {
              const variant = variants.find((v) => v.product_id == id);
              const productAvailable = variant
                ? variant.inventory_quantity > 0
                : "false";
                console.log('638',productAvailable);
              product.productAvailable = productAvailable;
            }
            return product;
          });
          const userId = notifyForm.id;
          if (!processedUserIds.has(userId)) {
            processedUserIds.add(userId);
            notifyForm.productId = updatedProductIds;
            // await notifyForm.save();
            console.log("642",notifyForm);
            const data = {
              id: notifyForm.id,
              shop:notifyForm.shopname,
              name: notifyForm.name,
              email: notifyForm.email,
              productId: updatedProductIds,
              createdAt: notifyForm.createdAt,
              updatedAt: notifyForm.updatedAt,

            };
            const webhookId = webhook.id
            const dataWithSmtpSettings = {
              ...data,
              notifySmtpSetting,
              productid:webhookId
            };
            // console.log(dataWithSmtpSettings)
            await sendProductAvailableMailQueue.add(dataWithSmtpSettings);
          }
        });

        await Promise.all(updatePromises);
      });

      await Promise.all(updates);

      console.log("Product details updated in the database successfully");
    }  if(!productAvailable) {
      console.log(`Product ID: ${id} is not available or has quantity 0`);
      const users = await NotifyForm.findAll();
  const updatePromises = users.map(async (user) => {
    const productIds = JSON.parse(user.productId);
    const updatedProductIds = productIds.map((product) => {
      if (product.id == id) {
      product.productAvailable = "false";
      product.thankyouemailresponsestatus = 'pending';
      product.instockresponsestatus ='pending'
    }
    return product;
    });
    user.productId = updatedProductIds;
    await user.save();
  });

  await Promise.all(updatePromises);

  console.log("Product details updated for all customers in the database successfully.");
}
    } catch (error) {
    console.error("Error updating product details in the database:", error);
    throw error;
  }
};

export const getCustomersByEmail = async (req, res) => {

  try {
    const { email } = req.params;
    let shopname = req.query.shopname;
    console.log(email,shopname)
    if (!email) {
      res.status(400).json({ product: [] });
      return;
    }

    const user = await NotifyForm.findOne({ where: { email,shopname } });
    // console.log("USER",user)
    if (!user || !user.productId) {
      res.status(200).json({ product: [] });
      return;
    }

    const productIds = JSON.parse(user.productId);
    const pIds = productIds.map((product) => product.id).join(",");

    if (productIds.length == 0) {
      res.status(200).json({ product: [] });
      return;
    }

    const products = await getShopifyProducts(pIds,shopname);
    // console.log(products)
    // console.log("PIDS",pIds)
    res.status(200).json({ product: products });
  } catch (error) {
    console.error("Error retrieving Customers", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getNotifyCustomers =  async (req, res) => {
  try {
    console.log("812",req.params.shopname)
     let shopname = req.params.shopname;
    const sql = `SELECT * FROM notifyforms where shopname='${shopname}'`;
    const [result] = await db.sequelize.query(sql);
    res.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getNotifyProducts = async (req, res) => {
  try {
    const notifyForms = await NotifyForm.findAll({
      where: {
        shopname: req.params.shopname,
      },
    });

    const productIds = [];
    notifyForms.forEach(form => {
      const parsedProductIds = JSON.parse(form.productId);
      parsedProductIds.forEach(productId => {
        if (!productIds.includes(productId.id)) {
          productIds.push(productId.id);
        }
      });
    });
     console.log(productIds)
    // Fetch the data of products using the product IDs
    const shopifyProducts = await getShopifyProducts(productIds,req.params.shopname);

// console.log(shopifyProducts)
    res.json(shopifyProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getCustomersByProductId = async (req, res) => {
  const productId = req.params.productId;
  const shopname = req.query.shopname
    // console.log(productId);
  try {
    const sql = `SELECT * FROM notifyforms WHERE JSON_CONTAINS(productId, '{"id": "${productId}"}', '$') AND shopname= '${shopname}'`;
    const [result] = await db.sequelize.query(sql);
    console.log(result)
    const customers = await NotifyForm.findAll({
      where: Sequelize.literal(
        `JSON_CONTAINS(productId, '{"id": "${productId}"}', '$')`
      ),
    });
// console.log(customers)
    res.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
