import fetch from "node-fetch";
import db from '../index.js';

async function verifyRecaptcha(token, secretKey) {
  const url = "https://www.google.com/recaptcha/api/siteverify";
  const response = await fetch(`${url}?secret=${secretKey}&response=${token}`, {
    method: "POST",
  });
  const data = await response.json();
  return data;
}

export const verifytoken = async (req, res, next) => {
  const { recaptchaEnabled, shopname, recaptchaToken } = req.body;
  if (!recaptchaEnabled) {
    next();
  } else {
    if (!recaptchaToken) {
      res.status(400).json({ error: "Recaptcha token is missing" });
      return;
    }
    
    try {
      const [result] = await db.sequelize.query(
        `SELECT recaptchaSetting FROM shopify_sessions WHERE shop = ?`,
        { replacements: [shopname], type: db.sequelize.QueryTypes.SELECT }
      );
      
      if (!result) {
        res.status(404).json({ error: "Shop not found" });
        return;
      }
      
      const recaptchaObj = JSON.parse(result.recaptchaSetting);
      const secretkey = recaptchaObj.secretKey;
      
      try {
        const data = await verifyRecaptcha(recaptchaToken, secretkey);
        
        if (data.success) {
          console.log("Recaptcha Validation Successful");
          next();
        } else {
          res.status(400).json({ error: "Recaptcha verification failed, Try again submitting the form." });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
