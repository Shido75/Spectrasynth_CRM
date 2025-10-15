const cron = require("node-cron");
const { fetchRecentEmails } = require("../Services/inquiryEmailfetch");

// Run every 1 minute
cron.schedule("* * * * *", () => {
  console.log("Running email fetch cron job...");
  fetchRecentEmails();
});
