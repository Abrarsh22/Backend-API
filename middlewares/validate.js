import Joi from 'joi';
import validator from "validator";

const createformschema = Joi.object({
  id: Joi.string().guid({version: ['uuidv4']}),
  formtitle: Joi.string().min(3).max(64).required(),
  shopname: Joi.string().required(),
  shortcode: Joi.string().required(),
  componentJSON: Joi.array().items(Joi.object().required()).min(1).required(),
  headerJSON: Joi.object().required(),
  footerJSON: Joi.object().required(),
  afterSubmit: Joi.object().required(),
  formSettings: Joi.object().required(),
  status: Joi.boolean().default(true),
  notifyFormStatus: Joi.boolean().default(false),
  formCSS: Joi.object(),
  klaviyoIntegration: Joi.object(),
  shopifyIntegration:Joi.object(),
});

const updateformschema = Joi.object({
  formtitle: Joi.string().min(3).max(64),
  componentJSON: Joi.array().items(Joi.object().required()).min(1),
  headerJSON: Joi.object(),
  footerJSON: Joi.object(),
  afterSubmit: Joi.object(),
  status: Joi.boolean(),
  notifyFormStatus: Joi.boolean(),
  formSettings: Joi.object(),
  formCSS: Joi.object(),
  klaviyoIntegration: Joi.object(),
  shopifyIntegration:Joi.object(),
});

const createSubmissionSchema = Joi.object({
  formtitle: Joi.string(),
  shopname: Joi.string(),
  formId: Joi.string(),
  fields: Joi.object(),
});


const validateUUID = (req, res, next) => {
  const {id} = req.query;
  req.id = id;
  if(!id){
    return res.status(400).json({ error: "Form uuid is required" });
  }else{
    if (!validator.isUUID(id, 4)) {
      return res.status(400).json({ error: "Invalid Form uuid." });
    }
  }
  next();
};

const validateBody = (req, res, next) => {
  const { error } = createformschema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateSubmissionBody = (req, res, next) => {
  const {recaptchaToken, recaptchaEnabled, adminMailSettings, klaviyoSettings, formFields, isDuplicate, autoResponseSettings, shopifySettings,status,notifyFormStatus,productid, 
    productAvailable,...data} = req.body;

  const { error } = createSubmissionSchema.validate(data);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateUpdateBody = (req, res, next) => {
  const { error } = updateformschema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}

export {validateBody,validateUpdateBody, validateUUID, validateSubmissionBody};