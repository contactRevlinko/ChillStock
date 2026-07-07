import bcrypt from "bcryptjs";
import { User } from "./models/User.js";
import { Branch } from "./models/Branch.js";
import { Product } from "./models/Product.js";
import { GlobalProduct } from "./models/GlobalProduct.js";
import { BranchProduct } from "./models/BranchProduct.js";

export async function seedDatabase() {
  try {
    // NOTE: We no longer delete existing admins or super admins.
    // This preserves previously created users across restarts.
    
    // Ensure a super admin exists – create only if missing
    const existingSuper = await User.findOne({ role: "super_admin" });
    if (!existingSuper) {
      const superHashed = await bcrypt.hash("superadmin123", 10);
      const superAdmin = new User({
        name: "Super Admin",
        email: "superadmin@icecream.com",
        password: superHashed,
        role: "super_admin"
      });
      await superAdmin.save();
      console.log("Super admin created (superadmin@icecream.com / superadmin123)");
    } else {
      console.log("Super admin already exists:", existingSuper.email);
    }

    // We no longer delete existing demo/global products to ensure data persists.
    // Add any additional seeding (branches, other data) here if needed, but DO NOT seed products.
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
