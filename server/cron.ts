import cron from "node-cron";
import { User } from "./models/User";

export function initCronJobs() {
  // Run every night at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily subscription expiry check...");
    try {
      const now = new Date();
      
      // Find all admins whose subscription has expired but are not yet marked as 'Expired'
      const expiredAdmins = await User.find({
        role: "admin",
        subscriptionEndDate: { $lt: now },
        paymentStatus: { $ne: "Expired" }
      });

      if (expiredAdmins.length === 0) {
        console.log("[CRON] No new expired subscriptions found.");
      } else {
        console.log(`[CRON] Found ${expiredAdmins.length} expired admin(s). Updating statuses...`);

        // Update their status
        const result = await User.updateMany(
          {
            role: "admin",
            subscriptionEndDate: { $lt: now },
            paymentStatus: { $ne: "Expired" }
          },
          {
            $set: {
              paymentStatus: "Expired",
              subscriptionStatus: "Inactive"
            }
          }
        );

        console.log(`[CRON] Successfully updated ${result.modifiedCount} admin(s) to Expired status.`);
      }

      // -------------------------------------------------------------
      // 2. CHECK FOR SUBSCRIPTIONS EXPIRING SOON
      // -------------------------------------------------------------
      // Note: In-app warning banners are handled on the frontend based on the subscriptionEndDate.
      console.log("[CRON] Completed nightly checks successfully.");

    } catch (error) {
      console.error("[CRON] Error during subscription expiry check:", error);
    }
  });

  console.log("Cron jobs initialized.");
}
