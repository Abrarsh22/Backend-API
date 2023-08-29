import db from '../index.js'; 
import fetch from 'node-fetch';

export const getKlaviyoList = async (req, res) => {
  const shop = req.query.shop;
  try {
    const sql = `SELECT klaviyoSetting FROM shopify_sessions WHERE shop = ?`;
    const [result] = await db.sequelize.query(sql, {
      replacements: [shop],
    });
  
    const klaviyoApiKey = JSON.parse(result[0].klaviyoSetting);
    const klaviyoPrivateKey = klaviyoApiKey.klaviyoApiprivateKey;
    const baseUrl = 'https://a.klaviyo.com/api/lists/';
    let allLists = [];
  
    let nextPage = baseUrl;
  
    while (nextPage) {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          revision: '2023-02-22',
          Authorization: `Klaviyo-API-Key ${klaviyoPrivateKey}`,
        },
      };
  
      const fetchResult = await fetch(nextPage, options);
      const json = await fetchResult.json();
      console.log(json)
      allLists = allLists.concat(json.data);
  
      // The 'json.next' field contains the URL for the next page.
      nextPage = json.links.next;
    }
      res.status(200).send(allLists);
  } catch (error) {
    console.error('error:' + error);
    res.status(500).json({ error: error });
  }
  
  
};