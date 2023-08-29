import { createForm, getForms, getForm, deleteForm, updateform, updateformStatus,notifyCustomers , getNotifyCustomers,getNotifyProducts,getCustomersByEmail,getCustomersByProductId,updatenotifyformstatus,getFormsExceptNotifyForm,getNotifyForm } from '../controllers/formController.js';
import { createSubmission, getSubmissions } from '../controllers/submissionController.js';
import { recaptchaSetting, smtpSetting, klaviyoSetting, getShopifySession, createSnippet,notifysmtpSetting,updateNotifyEmailSettings,
    updateNotifyInStockEmailSettings,createWebhook,pushDatainDB } from '../controllers/appSettingsController.js';
import {validateBody, validateUpdateBody, validateUUID, validateSubmissionBody} from '../middlewares/validate.js';
import { verifytoken } from '../middlewares/verifyRecaptcha.js';
import { handleDuplicate } from '../middlewares/handleDuplicate.js';
import { getKlaviyoList } from '../controllers/klaviyoController.js';


// router
import { Router } from 'express';
const router = Router();


// form routers
router.post('/createform', validateBody, createForm);
router.get('/getforms/:shopname', getForms);
router.get('/getform', validateUUID, getForm);
router.delete('/deleteForm', validateUUID, deleteForm);
router.put('/updateform', validateUUID, validateUpdateBody, updateform);
router.put('/updateformstatus', validateUUID, updateformStatus);
router.put('/updatenotifyformstatus', validateUUID, updatenotifyformstatus);
router.post('/notifyCustomers',notifyCustomers);
router.get('/getNotifyCustomers/:shopname',getNotifyCustomers);
router.get('/getNotifyProducts/:shopname',getNotifyProducts);
router.get('/getCustomersByEmail/:email',getCustomersByEmail);
router.get('/getCustomersByProductId/:productId',getCustomersByProductId);
router.get('/getFormsExceptNotifyForm/:shopname',getFormsExceptNotifyForm);
// submission routers
router.post('/submit', validateSubmissionBody, verifytoken, handleDuplicate, createSubmission);
router.get('/getSubmissions/:formtitle', getSubmissions);

// appSettings Router
router.post('/updateSmtpSettings', smtpSetting);
router.post('/updateRecaptchaSettings', recaptchaSetting);
router.post('/updateKlaviyoSettings', klaviyoSetting);
router.get('/getShopifySession', getShopifySession);
router.post('/updateNotifySmtpSettings',notifysmtpSetting);
router.get('/createSnippet',createSnippet);
router.get('/createWebhook',createWebhook);
router.post('/updateNotifyEmailSettings',updateNotifyEmailSettings);
router.post('/updateNotifyInStockEmailSettings',updateNotifyInStockEmailSettings);
router.post('/pushDatainDB',pushDatainDB)
// klaviyoController Router
router.get('/klaviyo/lists', getKlaviyoList);


export default router;
