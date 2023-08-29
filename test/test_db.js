import mysql from 'mysql2';

// Create connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'formdb'
});


// Generate a random product title
function generateProductTitle() {
  const titles = [
    'The GlenDronach Cask Strength Batch 11 700ml 59.8%',
    'DUNCAN TAYLOR SINGLE HIGHLAND PARK 18 YEAR',
    'FETTERCAIRN 18 YEAR OLD 46.8% 700ML',
  ];
  return titles[Math.floor(Math.random() * titles.length)];
}

// Generate a random product id
function generateProductID() {
  const titles = [
    '7523061924022',
    '7523061923452',
    '7235345234522',
  ];
  return titles[Math.floor(Math.random() * titles.length)];
}

// Generate a random customer ID
function generateCustomerId() {
  return Math.floor(Math.random() * 10000000000000);
}

// Generate a random IP address
function generateIPAddress() {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

// Generate 1500 queries with randomized data
function generateQueries() {
  const queries = [];

  for (let i = 0; i < 1500; i++) {
    const formId = '6692a09b-f074-495c-8361-193fddff3c4c'; // Same formId for all queries
    const name = `User ${i + 1}`;
    const email = `user${i + 1}@example.com`;
    const interest = ['Whisky', 'Wine', 'Malt'][Math.floor(Math.random() * 3)];
    const productId = generateProductID(); 
    const productTitle = generateProductTitle();
    const customerId = generateCustomerId();
    const ipAddress = generateIPAddress();
    const agreeMarketingEmails = Math.random() < 0.5;
    const comments = `Comment for User ${i + 1}`;

    const query = `INSERT INTO DemoForm1906 (formId, Name, Email, \`I'm interested in\`, product_id, product_title, customer_id, customer_ipAddress, \`Agree to recieve marketing emails\`, Comments)
      VALUES ('${formId}', '${name}', '${email}', '${interest}', '${productId}', '${productTitle}', '${customerId}', '${ipAddress}', ${agreeMarketingEmails}, '${comments}')`;

    queries.push(query);
  }

  return queries;
}

// Execute the queries one by one with a 0.1-second delay
function executeQueries() {
  const queries = generateQueries();
  let index = 0;

  function executeNextQuery() {
    if (index >= queries.length) {
      console.log('All queries executed.');
      pool.end(); // Close the connection pool
      return;
    }

    const query = queries[index];
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
      } else {
        console.log(`Query ${index + 1} executed successfully.`);
      }

      index++;
      setTimeout(executeNextQuery, 100); // Delay of 0.1 seconds
    });
  }

  executeNextQuery();
}

// Start executing the queries
executeQueries();
