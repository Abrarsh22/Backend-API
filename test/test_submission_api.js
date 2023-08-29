function generateRandomRequestBody() {
  const requestBody = {
    // Copy the common properties from the original requestBody
    formtitle: "DemoForm1906",
    fields: {
      Name: "mahendra yadav",
      Email: "mahendra@digitalrangers.in",
      "I'm interested in": ["Whisky", "Malt"],
      product_id: "7523061924022",
      product_title: "The GlenDronach Cask Strength Batch 11 700ml 59.8%",
      customer_id: "6600014528694",
      customer_ipAddress: "45.127.88.208",
      "Agree to recieve marketing emails": true,
      Comments: "Comment from amhendra yadav"
    },
    recaptchaEnabled: false,
    adminMailSettings: {
      enable: false,
      email: "",
      emailSubject: "You have new submission",
      emailContent: ""
    },
    autoResponseSettings: {
      autoenable: false,
      autoemailContent: "<body><div> Your data: </br> {{data}}</div></body>",
      autoemail: "",
      autoemailSubject: "Thank you for your response",
      form_field: ""
    },
    shopname: "thespiritsembassy-dev.myshopify.com",
    klaviyoSettings: {
      enable: false,
      defaultOption: "RLvUEf",
      klaviyoListMapping: {
        0: {
          klaviyo_field: "Email",
          form_field: "d81323a6-457e-4cf0-b75d-71b9d935284b",
          is_default: true,
          is_fixed: false
        },
        1: {
          klaviyo_field: "Subscribed",
          form_field: "36b31dd2-5dd3-46a2-8ca8-6345d9b5d750",
          is_default: true,
          is_fixed: false
        },
        2: {
          klaviyo_field: "First Name",
          form_field: "5832a709-833f-48c6-909d-0b53f26c6dfb",
          is_default: true,
          is_fixed: false
        }
      },
      listMethod: "singlelist"
    },
    formId: "6692a09b-f074-495c-8361-193fddff3c4c",
    formFields: [
      {
        id: "5832a709-833f-48c6-909d-0b53f26c6dfb",
        type: "name",
        datatype: "VARCHAR(255)",
        name: "full_name",
        label: "Name",
        placeholder: "",
        description: "",
        limitCharacter: false,
        minLength: 3,
        maxLength: 20,
        hideLabel: false,
        required: true,
        displayRequiredNoteOnLabelHide: false,
        inputFieldWidth: "49%"
      },
      {
        id: "d81323a6-457e-4cf0-b75d-71b9d935284b",
        type: "email",
        datatype: "VARCHAR(255)",
        label: "Email",
        placeholder: "",
        description: "",
        limitCharacter: false,
        minLength: 0,
        maxLength: 30,
        hideLabel: false,
        required: true,
        displayRequiredNoteOnLabelHide: false,
        inputFieldWidth: "49%"
      },
      {
        id: "65e40516-7792-430c-94cc-368a4a9cf2bf",
        datatype: "VARCHAR(255)",
        type: "checkbox",
        label: "I'm interested in",
        description: "",
        options: ["Whisky", "Malt", "Wine"],
        defaultOptionChecked: "Whisky",
        hideLabel: false,
        required: true,
        displayRequiredNoteOnLabelHide: false,
        inputFieldWidth: "100%"
      },
      {
        id: "a77d8d37-b89f-459c-8bb8-6bc84bff2b82",
        datatype: "VARCHAR(255)",
        type: "textarea",
        label: "Comments",
        placeholder: "Enter your thoughts about TSE",
        description: "",
        limitCharacter: true,
        minLength: 0,
        maxLength: 50,
        hideLabel: false,
        required: true,
        displayRequiredNoteOnLabelHide: false,
        inputFieldWidth: "100%"
      },
      {
        id: "d8198224-d2c9-4f10-85ac-c3672b80ce0f",
        datatype: "LONGTEXT",
        type: "hidden",
        label: "Hidden",
        value: ["product.id", "product.title", "customer.id", "customer.ipAddress"]
      },
      {
        id: "36b31dd2-5dd3-46a2-8ca8-6345d9b5d750",
        type: "termsnconditions",
        datatype: "BOOLEAN",
        label: "Agree to receive marketing emails",
        description: "",
        defaultChecked: true,
        required: false,
        inputFieldWidth: "100%"
      }
    ],
    isDuplicate: {
      enable: true,
      IdentifierFields: ["Email", "product.id"],
      IdentifierCriteria: "AND"
    },
    shopifyIntegration: {
      createenable: false,
      inviteenable: false,
      shopifyexists: "",
      showError: false,
      msgError: "",
      accountOptions: "",
      sendInvite: false,
      acceptsMarketting: false,
      shopifyListMapping: [
        {
          shopify_field: "",
          form_field: "",
          is_default: true,
          is_fixed: false,
          is_input: ""
        }
      ]
    }
  };

  // Generate random values for specific properties
  requestBody.fields.Name = generateRandomName();
  requestBody.fields.Email = generateRandomEmail();
  requestBody.fields["I'm interested in"] = generateRandomInterests();
  requestBody.fields.product_id = generateRandomProductId();
  requestBody.fields.product_title = generateRandomProductTitle();
  requestBody.fields.customer_id = generateRandomCustomerId();
  requestBody.fields.customer_ipAddress = generateRandomIpAddress();
  requestBody.fields["Agree to recieve marketing emails"] = generateRandomBoolean();
  requestBody.fields.Comments = generateRandomComments();

  return requestBody;
}

function generateRandomName() {
  return getRandomString(8, 20);
}

function generateRandomEmail() {
  const username = getRandomString(5, 10);
  const domain = getRandomString(5, 10);
  const extension = getRandomString(2, 3);
  return `${username}@${domain}.${extension}`;
}

function generateRandomInterests() {
  const interests = ["Whisky", "Malt", "Wine"];
  const randomIndex = Math.floor(Math.random() * interests.length);
  return [interests[randomIndex]];
}

function generateRandomProductId() {
  const interests = ["235235345235", "474574548678", "2352353412342"];
  const randomIndex = Math.floor(Math.random() * interests.length);
  return [interests[randomIndex]];
}

function generateRandomProductTitle() {
  return getRandomString(10, 40);
}

function generateRandomCustomerId() {
  const min = 1000000000000;
  const max = 9999999999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function generateRandomIpAddress() {
  const maxSegmentValue = 255;
  return `${getRandomNumber(1, maxSegmentValue)}.${getRandomNumber(0, maxSegmentValue)}.${getRandomNumber(0, maxSegmentValue)}.${getRandomNumber(1, maxSegmentValue)}`;
}

function generateRandomBoolean() {
  return Math.random() < 0.5;
}

function generateRandomComments() {
  return getRandomString(10, 50);
}
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomString(minLength, maxLength) {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = getRandomNumber(minLength, maxLength);
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}


// Generate 700 random requestBody objects
const randomRequests = Array.from({ length: 700 }, generateRandomRequestBody);

// Generate 300 duplicate requestBody objects
const duplicateRequests = Array.from({ length: 300 }, () => randomRequests[Math.floor(Math.random() * 700)]);

// Combine random and duplicate requests
const allRequests = randomRequests.concat(duplicateRequests);

import axios from 'axios';
import async from 'async';

const endpoint = 'http://localhost:8080/api/forms/submit'; // Replace with your actual API endpoint

// Function to make a single API call
function makeApiCall(requestBody, callback) {

  axios.post(endpoint, requestBody)
    .then(response => {
      // Handle the API response
      callback(null, response.data.insertId);
    })
    .catch(error => {
      // Handle any errors that occurred during the API call
      callback(error.message);
    });
}

// Generate an array of functions to make concurrent API calls
const apiCallFunctions = allRequests.map(request => () => makeApiCall(request, (error, data) => {
  if (error) {
    console.error('API call error:', error);
    // Handle the error or perform any necessary logging or error reporting
  } else {
    console.log('API call success:', data);
  }
}));

// Execute the API calls concurrently
async.parallelLimit(apiCallFunctions, 1000, (error, results) => {
  if (error) {
    console.error('Error occurred during API calls:', error);
  } else {
    console.log('API calls completed successfully.', results);
  }
});


