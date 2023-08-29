import Queue from "bull";
import { sendProductAvailableResponse,sendThankyouResponse } from "./sendMailWithGoogle.js";

const sendProductAvailableMailQueue = new Queue("sendProductAvailableMail");


sendProductAvailableMailQueue
  .on('completed', (job, result) => {
    console.log(`ProductAvailable Mail Job ${job.id} completed`);
  })
  .on('failed', (job, err) => {
    console.log(`ProductAvailable Mail Job ${job.id} failed with error ${err}`);
  });
  const processedJobs = new Set(); // Create a Set to store processed job IDs

sendProductAvailableMailQueue.process(async (job) => {
  console.log("ProductAvailable Mail sending process has started");
//   console.log(job.data);

  // Check if the job has already been processed
  if (processedJobs.has(job.id)) {
    // console.log("Job already processed, skipping...");
    return;
  }

  // Process the job and send the email
  try {
    console.log('28',job.data);
    await sendProductAvailableResponse(job.data);
    processedJobs.add(job.id); // Add the processed job ID to the set
  } catch (error) {
    console.log("Error sending email:", error);
  }
});
sendProductAvailableMailQueue.isReady().then(() => {
  console.log('ProductAvailable Mail worker is running');
});

const sendThankyouMailQueue = new Queue("sendThankyouMail");


sendThankyouMailQueue
  .on('completed', (job, result) => {
    console.log(`Thankyou Mail Job ${job.id} completed`);
  })
  .on('failed', (job, err) => {
    console.log(`Thankyou Mail Job ${job.id} failed with error ${err}`);
  });
sendThankyouMailQueue.process(async (job) => {
  console.log("Thankyou Mail sending process has started")
   console.log("50",job.data)
  return await sendThankyouResponse(job.data);
});

sendThankyouMailQueue.isReady().then(() => {
  console.log('Thankyou Mail worker is running');
});

export {sendProductAvailableMailQueue,sendThankyouMailQueue};