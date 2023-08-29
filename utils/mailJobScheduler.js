import Queue from "bull";
import { sendMailWithGoogle, sendAutoResponse } from "./sendMailWithGoogle.js";
// 1. Initiating the Queue
const sendMailQueue = new Queue("sendMail");


// 3. Consumer
sendMailQueue
  .on('completed', (job, result) => {
    console.log(`Mail Job ${job.id} completed`);
  })
  .on('failed', (job, err) => {
    console.log(`Mail Job ${job.id} failed with error ${err}`);
  });

sendMailQueue.process(async (job) => {
  console.log("Mail sending process has started")
  return await sendMailWithGoogle(job.data);
});

sendMailQueue.isReady().then(() => {
  console.log('Mail worker is running');
});
const sendAutoMailQueue = new Queue("sendAutoMail");


// 3. Consumer
sendAutoMailQueue
  .on('completed', (job, result) => {
    console.log(`Auto Mail Job ${job.id} completed`);
  })
  .on('failed', (job, err) => {
    console.log(`Auto Mail Job ${job.id} failed with error ${err}`);
  });

sendAutoMailQueue.process(async (job) => {
  console.log("Auto Mail sending process has started")
 // console.log(job.data)
  return await sendAutoResponse(job.data);
});

sendAutoMailQueue.isReady().then(() => {
  console.log('Auto Mail worker is running');
});

export {sendMailQueue,sendAutoMailQueue};