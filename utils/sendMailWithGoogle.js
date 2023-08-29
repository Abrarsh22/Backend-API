import nodemailer from "nodemailer";
import fetch from "node-fetch";
import db from '../index.js';
const NotifyForm = db.notifyforms;

function generateFieldList(fields) {
  let html = "<ul>";
  for (let key in fields) {
    html += `<li><strong>${key}:</strong> ${fields[key]}</li>`;
  }
  html += "</ul>";
  return html;
}

export const sendMailWithGoogle = (data) => {
  let { email, emailSubject, emailContent, maildata, jsonData } = data;
  emailContent += generateFieldList(jsonData.fields);

  const mailConfig = {
    host: maildata?.smtpProvider,
    port: parseInt(maildata?.portNo),
    secure: true,
    auth: {
      user: maildata?.username,
      pass: maildata?.appPassword,
    },
  };

  return new Promise((resolve, reject) => {
    let mailOptions = {
      from: `${jsonData.shopname.split(".")[0]} <vaibhav@digitalrangers.in>`,
      to: email,
      subject: emailSubject,
      html: emailContent,
    };

    nodemailer
      .createTransport(mailConfig)
      .sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(info);
        }
      });
  });
};

export const sendAutoResponse = (data) => {
  let {
    autoemailContent,
    autoemail,
    autoemailSubject,
    jsonData,
    maildata,
    form_field,
  } = data;
  autoemail = jsonData.fields[form_field];
  const mailConfig = {
    host: maildata?.smtpProvider,
    port: parseInt(maildata?.portNo),
    secure: true,
    auth: {
      user: maildata?.username,
      pass: maildata?.appPassword,
    },
  };

  return new Promise((resolve, reject) => {
    let mailOptions = {
      from: `${jsonData.shopname.split(".")[0]} <vaibhav@digitalrangers.in>`,
      to: autoemail,
      subject: autoemailSubject,
      html: autoemailContent.replace(
        "{{data}}",
        generateFieldList(jsonData.fields)
      ),
    };

    nodemailer
      .createTransport(mailConfig)
      .sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log("Error is", err);
          reject(err);
        } else {
          resolve(info);
        }
      });
  });
};
const processedProductIds = new Set();
const resetProcessedProductIds = () => {
  processedProductIds.clear();
  console.log('Processed product IDs reset.');
};

export const sendProductAvailableResponse = async (data) => {
  
  const sentProductIds = new Set();

  const shop = data.shop;
  const sql = `SELECT notifyInStockEmailResponseSettings FROM shopify_sessions WHERE shop = ?`;

  const [result] = await db.sequelize.query(sql, {
    replacements: [shop],
  });

  try {
    const { notifyInStockEmailResponseSettings } = result[0];
    const { InstockemailContent, InstockemailSubject } = JSON.parse(notifyInStockEmailResponseSettings);

    const notifySmtpSetting = data.notifySmtpSetting;

    const mailConfig = {
      host: notifySmtpSetting.smtpProvider,
      port: parseInt(notifySmtpSetting.portNo),
      secure: true,
      auth: {
        user: notifySmtpSetting.username,
        pass: notifySmtpSetting.appPassword,
      },
    };

    const webhookProductId = data.productid;
    console.log("150", webhookProductId);
console.log("148",data)
    // Find the product with the webhookProductId
    const productToSend = data.productId.find((product) => product.id == webhookProductId);
console.log('151',productToSend)
    if (!productToSend) {
      console.log(`Product ID: ${webhookProductId} not found in the database`);
      return;
    }

    const { id, productAvailable, instockresponsestatus,thankyouemailresponsestatus } = productToSend;
console.log(instockresponsestatus,productAvailable )

    if (productAvailable == true && instockresponsestatus != 'Sent' && thankyouemailresponsestatus == 'Sent'
&& !sentProductIds.has(id) && !processedProductIds.has(data.email)) {
      try {
        console.log("TO SEND ", data.email);
        const productDetails = await getShopifyProducts(id,shop);
        const productName = productDetails[0].title;
        const productImage = productDetails[0].image ? productDetails[0].image.src : null;
        const productLink = `https://${shop}/products/${productDetails[0].handle}`;

        const replacedInStockEmailContent = InstockemailContent
          .replace(/{product.name}/g, productName)
          .replace(/{product.image}/g, `<img src="${productImage}" alt="${productName}" style="max-width: 50%; height: 50%;" />`)
          .replace(/{product.link}/g, `<a href="${productLink}" style="display: inline-block; padding: 10px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">View Product</a>`);

          const mailOptions = {
          from: 'your_sender_email_address',
          to: data.email,
          subject: InstockemailSubject.replace(/{product.name}/g, productName),
          html: replacedInStockEmailContent,
        };
        if (id == webhookProductId) {
          console.log("SENDING EMAIL")
          
          console.log('186',processedProductIds,sentProductIds)
          const sendResult = await sendEmail(mailConfig, mailOptions);
          console.log(`Email sent for product ID: ${id}`);
           processedProductIds.add(data.email);
          sentProductIds.add(id);
        // Update the email status to 'Sent'
        if (sendResult && instockresponsestatus !='Sent') {
          if (sendResult && instockresponsestatus !='Sent' && productToSend.id == id) {
          console.log('Email sent successfully');
           await updateInStockStatus(data.email, id, 'Sent');
          console.log(`In Stock email status updated to 'Sent' for product ID: ${id}`);
	 setTimeout(resetProcessedProductIds, 15000);
        } 
      }else {
          console.log('Failed to send email');
          // updateThankyouEmailStatus(data.email, id, 'Failed');
        }
      }
      } catch (error) {
        console.log(`Error sending email for product ID: ${id}`, error);
      }
    } else {
      console.log(`Skipping email for product ID: ${id}`);
    }
  } catch (error) {
    console.log('Error parsing notifyInStockEmailResponseSettings JSON:', error);
  }
  
};

const updateInStockStatus = async (email, productId, status) => {
  try {
    const existingCustomer = await NotifyForm.findOne({ where: { email } });
    if (existingCustomer) {
      const existingProductIds = JSON.parse(existingCustomer.productId);
      const updatedProductIds = existingProductIds.map((product) => {
        if (product.id == productId) {
          return { ...product, productAvailable:"true", instockresponsestatus: status,thankyouemailresponsestatus:'pending' };
        }
        return product;
      });
      await NotifyForm.update(
        { productId: updatedProductIds },
        { where: { email } }
      );
      console.log(`In Stock email status updated to '${status}' for product ID: ${productId}`);
	
    } else {
      // If the customer does not exist, insert a new entry with the failed status
      const newCustomer = await NotifyForm.create({
        name: '',
        email,
        productId: [{ id: productId, instockresponsestatus: status }],
      });
      console.log(`New customer entry created with email '${email}' and product ID '${productId}'`);
    }
  } catch (error) {
    console.log(`Error updating In Stock email status for product ID: ${productId}`, error);
    // Update the status to 'Failed' in case of error
    await NotifyForm.update(
      { productId: { id: productId, instockresponsestatus: 'Failed' } },
      { where: { email } }
    );
    console.log(`InStock email status updated to 'Failed' for product ID: ${productId}`);
  }
};
const getShopifyProducts = async (pIds,shopname) => {
  // console.log("PIDS",pIds)
  const sql = `SELECT accessToken FROM shopify_sessions WHERE shop = ?`;

  const [accessTokenObj] = await db.sequelize.query(sql, {
    replacements: [shopname],
  });
  const accessToken = accessTokenObj[0].accessToken;
  console.log(accessToken);

  const response = await fetch(
    `https://${shopname}/admin/api/2023-04/products.json?ids=${pIds}`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );
  const data = await response.json();
  // console.log(data.products);
  return data.products;
};
const getAllShopifyProducts = async (shop) => {
  // console.log("PIDS",pIds)
  const sql = `SELECT accessToken FROM shopify_sessions WHERE shop = ?`;

  const [accessTokenObj] = await db.sequelize.query(sql, {
    replacements: [shop],
  });
  const accessToken = accessTokenObj[0].accessToken;
  console.log(accessToken);
  const response = await fetch(
    `https://${shop}/admin/api/2023-04/products.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );
  const data = await response.json();
  // console.log(data.products);
  return data.products;
};
const sendEmail = (mailConfig, mailOptions) => {
  return new Promise((resolve, reject) => {
    nodemailer.createTransport(mailConfig).sendMail(mailOptions, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

export const sendThankyouResponse = async (data) => {
  console.log('Thank you')
  const shop = data.shopname;
  console.log('290',shop)
  const sql = `SELECT notifythankyouemailResponse FROM shopify_sessions WHERE shop = ?`;

  const [result] = await db.sequelize.query(sql, {
    replacements: [shop],
  });

  try {
    const { notifythankyouemailResponse } = result[0];
    const { thankyouemailContent, thankyouemailSubject } = JSON.parse(notifythankyouemailResponse);
    // console.log(thankyouemailContent,thankyouemailSubject)

    const notifySmtpSetting = data.notifySmtpSetting;
console.log(notifySmtpSetting)
    const mailConfig = {
      host: notifySmtpSetting.smtpProvider,
      port: parseInt(notifySmtpSetting.portNo),
      secure: true,
      auth: {
        user: notifySmtpSetting.username,
        pass: notifySmtpSetting.appPassword,
      },
    };

    const productIds = data.productId;
    console.log(productIds)
    for (const product of productIds) {
      const { id, productAvailable,thankyouemailresponsestatus } = product;
      if (productAvailable == 'false' && thankyouemailresponsestatus != 'Sent' ) {
        try {
          const productDetails = await getShopifyProducts(id,shop);
          const productName = productDetails[0].title;
          const productImage = productDetails[0].image ? productDetails[0].image.src : null;
          const productLink = `https://${shop}/products/${productDetails[0].handle}`;
  
const replacedThankyouEmailContent = thankyouemailContent
  .replace(/{product.name}/g, productName)
  .replace(/{product.image}/g, `<img src="${productImage}" alt="${productName}" style="max-width: 50%; height: 50%;" />`)
  .replace(/{product.link}/g, `<a href="${productLink}" style="display: inline-block; padding: 10px; background-color: gold; color: #000000; text-decoration: none; border-radius: 5px;">View Product</a>`)

          const mailOptions = {
            from: 'your_sender_email_address',
            to: data.email,
            subject: thankyouemailSubject.replace(/{product.name}/g, productName),
            html: replacedThankyouEmailContent,
          };

          const sendResult = await sendThankyouEmail(mailConfig, mailOptions);
         console.log(sendResult)
          if (sendResult) {
            console.log('Email sent successfully');
            await updateThankyouEmailStatus(data.email, id, 'Sent',data.fields,data.formfields);
            console.log(`Thank you email status updated to 'sent' for product ID: ${id}`);
          } else {
            console.log('Failed to send email');
            //updateThankyouEmailStatus(data.email, id, 'Failed');
          }
        } catch (error) {
          console.log(`Error sending email for product ID: ${id}`, error);
        }
      }
    }
  } catch (error) {
    console.log('Error parsing notifythankyouemailResponse JSON:', error);
  }
};
const updateThankyouEmailStatus = async (email, productId, status,fields,formfields) => {
  try {
    console.log(fields,formfields);
    const emailFieldName = Object.keys(fields)[0];
    console.log(emailFieldName)
    const existingCustomer = await NotifyForm.findOne({ where: { email } });
    if (existingCustomer) {
      const existingProductIds = JSON.parse(existingCustomer.productId);
      const updatedProductIds = existingProductIds.map((product) => {
        if (product.id == productId) {
          return { ...product, thankyouemailresponsestatus: status,instockresponsestatus:"pending"};
        }
        return product;
      });
      await NotifyForm.update(
        { productId: updatedProductIds },
        { where: { email } }
      );
      console.log(`Thank you email status updated to '${status}' for product ID: ${productId}`);
    } 
  } catch (error) {
    // console.log(`Error updating thank you email status for product ID: ${productId}`, error);
    // Update the status to 'Failed' in case of error
    await NotifyForm.update(
      { productId: { id: productId, thankyouemailresponsestatus: 'Failed' } },
      { where: { email } }
    );
    console.log(`Thank you email status updated to 'Failed' for product ID: ${productId}`);
  }
};

const sendThankyouEmail = (mailConfig, mailOptions) => {
  return new Promise((resolve, reject) => {
    nodemailer.createTransport(mailConfig).sendMail(mailOptions, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

