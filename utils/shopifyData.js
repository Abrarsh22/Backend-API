import Queue from "bull";
import fetch from "node-fetch";
import { connection } from '../server.js';

// 1. Initiating the Queue
const shopifyDataQueue = new Queue("shopify");

// 3. Consumer
shopifyDataQueue
  .on("completed", (job, result) => {
    console.log(`Shopify Job ${job.id} completed`);
  })
  .on("failed", (job, err) => {
    console.log(`Shopify Job ${job.id} failed with error ${err}`);
  });

shopifyDataQueue.process(async (job) => {
  console.log("Shopify Data sending process has started");
  const { shopname, fields } = job.data.data;
  const { shopifySettings, formFields } = job.data;
  if (fields.phone) {
    let phoneNumber = fields.phone; // Get the phone number from the fields object
    let formattedPhoneNumber = phoneNumber.replace(/\D/g, ""); // Remove non-digit characters from the phone number
    let countryCode = phoneNumber.match(/\+\d+/); // Extract the country code from the phone number

    if (countryCode && formattedPhoneNumber.startsWith(countryCode[0])) {
      const countryCodeWithSpace = `${countryCode[0]} `;
      const phoneNumberWithoutCountryCode = formattedPhoneNumber.substr(
        countryCode[0].length
      );
      fields.phone = countryCodeWithSpace + phoneNumberWithoutCountryCode; // Update the phone number with the formatted version including the country code and space
    }
  }

  const createCustomer = async (shopDomain, adminapi, customerData) => {
    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/2023-04/customers.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminapi,
          },
          body: JSON.stringify({
            customer: customerData,
          }),
        }
      );

      if (response.ok) {
        const createdCustomer = await response.json();
        return createdCustomer;
      } else {
        const errorResponse = await response.json();
        console.log("Failed to create customer:", errorResponse);
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  const fetchCustomers = async (shopDomain, adminapi, customer_email) => {
    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/2023-04/customers/search.json?query=email:${customer_email}`,
        {
          headers: {
            "X-Shopify-Access-Token": adminapi,
          },
        }
      );
      const data = await response.json();
      const customer = data.customers;
      return customer;
    } catch (error) {
      throw new Error(error);
    }
  };

  const updateCustomer = async (
    customerId,
    shopDomain,
    adminapi,
    updatedFields
  ) => {
    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/2023-04/customers/${customerId}.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminapi,
          },
          body: JSON.stringify({
            customer: updatedFields,
          }),
        }
      );

      if (response.ok) {
        const updatedCustomer = await response.json();
        return updatedCustomer;
      } else {
        const errorResponse = await response.json();
        console.log("Failed to update customer:", errorResponse);
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  const sendCustomerInvite = async (shopDomain, adminApi, customerId) => {
    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/2023-04/customers/${customerId}/send_invite.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminApi,
          },
          body: JSON.stringify({
            customer_invite: {
              customer_id: customerId,
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Customer invite sent:", result);
      } else {
        const errorResponse = await response.json();
        console.log("Failed to send customer invite:", errorResponse);
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  try {
    const shop = shopname;
    const sql = `SELECT shop,accessToken FROM shopify_sessions WHERE shop = ?`;
    let createdCustomer, customerId;
    connection.query(sql, [shop], async (err, result) => {
      if (err) {
        console.log(err);
      } else {
        if (result && result.length > 0) {
          const shopDomain = result[0].shop;
          const adminapi = result[0].accessToken;

          const fieldMapping = {};
          const customerData = {};

          // Populate fieldMapping object
          for (const mapping of Object.values(
            shopifySettings.shopifyListMapping
          )) {
            const formFieldId = mapping.form_field;
            const formField = formFields.find(
              (field) => field.id === formFieldId
            );

            if (formField) {
              const formFieldLabel = formField.label;
              const formFieldType = formField.type;
              const formFieldName = formField.name;

              if (formFieldType === "name") {
                fieldMapping[formFieldLabel] = formFieldName;
              } else {
                fieldMapping[formFieldLabel] = formFieldType;
              }
            }
          }
          if (shopifySettings.acceptsMarketting) {
            customerData["accepts_marketing"] =
              shopifySettings.acceptsMarketting;
          } else {
            customerData["accepts_marketing"] = false;
          }

          // Populate customerData object
          for (const fieldKey in fields) {
            const formFieldLabel = fieldKey;
            const shopifyField = fieldMapping[formFieldLabel];
            if (shopifyField) {
              if (
                shopifyField === "termsnconditions" &&
                !shopifySettings.acceptsMarketting
              ) {
                customerData["accepts_marketing"] = fields[fieldKey];
              } else {
                customerData[shopifyField] = fields[fieldKey];
              }
            }
          }
          const customers = await fetchCustomers(
            shopDomain,
            adminapi,
            customerData.email
          );

          if (customers.length !== 0) {
            const matchingCustomer = customers[0];
            console.log("Matching customer ID:", customers[0].id);
            if (
              matchingCustomer &&
              shopifySettings.shopifyexists === "returnError"
            ) {
              console.log(
                "Errror Returned ---- Customer already exists with the provided email"
              );
            } else if (
              matchingCustomer &&
              shopifySettings.shopifyexists === "continueAndUpdate"
            ) {
              customerId = matchingCustomer.id;

              await updateCustomer(
                customerId,
                shopDomain,
                adminapi,
                customerData
              );
              console.log("Existing Shopify Customer updated successfully");
              return;
            } else if (
              matchingCustomer &&
              shopifySettings.shopifyexists === "continueAndIgnoreError"
            ) {
              console.log("Customer Exists: Continue and Ignore Error");
            }
            if (
              matchingCustomer &&
              shopifySettings.showError == true &&
              shopifySettings.msgError != ""
            ) {
              console.log("Error (Set by Admin): ", shopifySettings.msgError);
            }
          } else {
            console.log(
              "else part is executed",
              shopifySettings.accountOptions
            );
            if (
              shopifySettings.accountOptions === "Automatically Create Customer"
            ) {
              createdCustomer = await createCustomer(
                shopDomain,
                adminapi,
                customerData
              );

              console.log(
                "Customer created successfully:",
                createdCustomer.customer.id
              );
            } else if (
              shopifySettings.accountOptions === "Send Email Invitation"
            ) {
              const createdCustomer = await createCustomer(
                shopDomain,
                adminapi,
                customerData
              );
              console.log(
                "Customer created successfully by sending link",
                createdCustomer.customer.id
              );
              await sendCustomerInvite(
                shopDomain,
                adminapi,
                createdCustomer.customer.id
              );
            }
            if (shopifySettings.acceptsMarketing === true) {
              const updatedFields = {
                accepts_marketing: customerData["accepts_marketing"],
              };

              await updateCustomer(
                customerId,
                shopDomain,
                adminapi,
                updatedFields
              );
              console.log("Customer Marketing status updated successfully");
            }
          }
        } else {
          console.log("Shopify setting not found");
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
});

shopifyDataQueue.isReady().then(() => {
  console.log("Shopify Data worker is running");
});

export { shopifyDataQueue };
