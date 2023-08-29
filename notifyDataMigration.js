import fs from 'fs';
import xlsx from 'xlsx';
import mysql from 'mysql2/promise';

// MySQL database connection configuration
const dbConfig = {
   host: "localhost",
  user: "formdbstageuser",
  password: "U49npW7jn^eW",
  database: "formdb_stage",  
};
// Define a function to extract URL from formula
const extractURLFromFormula = formula => {
    const regex = /"([^"]+)"/;
    const matches = formula.match(regex);
    if (matches && matches.length >= 2) {
      return matches[1];
    }
    return '';
  };
// Read the XLSX file
const xlsxFilePath = 'SubmissionsExport.xlsx';
// Read the XLSX file
const workbook = xlsx.readFile(xlsxFilePath);
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


// Define a function to extract variant ID from URL
const extractVariantIdFromURL = link => {
    // console.log('link',link)
  const parsedUrl = new URL(link);
  return parsedUrl.searchParams.get('variant');
};


const convertRowToJSON = row => {
    // console.log("ROW",row)
    const productAvailable = row['Available quantity'] == 0 ? "false" : "true";
    const productURL = row['Product'].toString();
    const variantId = extractVariantIdFromURL(productURL);
  
    const productObject = {
      id: variantId,
      createdAt: row['Subscribed date'],
      productAvailable: productAvailable,
      thankyouemailresponsestatus: 'pending', //Not in CSV
      instockresponsestatus: row.Status,
    };
  const productJSON = JSON.stringify([productObject]);
    return {
      shopname: 'thespiritsembassy-stagging.myshopify.com', //Not in CSV
      formid: '074058c6-8254-4b06-bde6-32b24be78619',  //Not in csv
      productId: productJSON, // Store as an array of objects
      createdat: row['Subscribed date'],
      updatedat: row['Last Sent'] || row['Subscribed date'], //Not in csv
      email: row['Customer email'],
      };
  };
  
  

const main = async () => {
  const jsonData = sheetData.map(convertRowToJSON);

  // Create a MySQL connection
  const connection = await mysql.createConnection(dbConfig);

//   // Insert data into the MySQL database
  for (const data of jsonData) {
    const insertQuery = 'INSERT INTO notifyforms SET ?'; // Replace with your table name
    await connection.query(insertQuery, data);
  }

  // Close the connection
  await connection.end();

  console.log('Data inserted into MySQL database.');
};

main().catch(error => {
  console.error('Error:', error);
});

