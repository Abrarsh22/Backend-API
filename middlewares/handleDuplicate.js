import db from "../index.js";

export const handleDuplicate = async (req, res, next) => {
  const { isDuplicate, fields, formtitle } = req.body;
  const { enable, IdentifierFields, IdentifierCriteria } = isDuplicate;
  console.log(IdentifierFields)
  if (!enable || IdentifierFields.length === 0) {
    console.log("No Duplication need to checked");
    next();
  } else {
    // Generate placeholders for each label
    const placeholders = IdentifierFields.map(
      (label) => `\`${label.replace(/\./g, '_')}\` = ?`
    ).join(` ${IdentifierCriteria} `);

    // Create the SQL statement with the dynamic placeholders
    const sql = `SELECT * FROM \`${formtitle}\` WHERE ${placeholders}`;

    // Prepare the values to be passed in the query
    const values = IdentifierFields.map((label) => {
      let labelVal = label.replace(/\./g, '_')
      if (fields[labelVal] === undefined) {
        return null;
      }
      return fields[labelVal];
    });

    console.log(sql,values)
    try {
      const result = await db.sequelize.query(sql, {
        replacements: values,
        type: db.sequelize.QueryTypes.SELECT,
      });

      
      if (result.length > 0) {
        console.log("Duplicatiion found", result);
        return res.status(400).json({
          error: `Form already been submitted with this details!`,
        });
      } else {
        console.log("Duplicatiion not found ");
        next();
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        error: `Internal server error, Please try again later.`,
      });
    }
  }
};
