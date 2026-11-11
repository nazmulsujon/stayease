/**
 * Creates the administrator account (admins cannot sign up publicly).
 * Reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE and ADMIN_PASSWORD from
 * `.env.local`. Run with: npm run seed:admin
 *
 * Safe to run more than once: an existing admin is left unchanged.
 * Pass --reset-password to set the password of an existing admin again.
 */
import { connectToDatabase, disconnectFromDatabase } from "../src/lib/db-core";
import { hashPassword } from "../src/lib/auth/password";
import { User } from "../src/models/user";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  phoneSchema,
} from "../src/validations/auth";
import { z } from "zod";

const adminEnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().default("stayease"),
  ADMIN_NAME: nameSchema,
  ADMIN_EMAIL: emailSchema,
  ADMIN_PHONE: phoneSchema,
  ADMIN_PASSWORD: passwordSchema,
});

async function main() {
  const parsed = adminEnvSchema.safeParse({
    ...process.env,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || undefined,
  });
  if (!parsed.success) {
    console.error("✖ Invalid admin settings in .env.local:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  const env = parsed.data;
  const resetPassword = process.argv.includes("--reset-password");

  await connectToDatabase(env.MONGODB_URI, env.MONGODB_DB_NAME);
  await User.init(); // make sure the unique email index exists

  const existing = await User.findOne({ email: env.ADMIN_EMAIL });

  if (existing && existing.role !== "admin") {
    console.error(
      `✖ ${env.ADMIN_EMAIL} already belongs to a customer account. Use a different ADMIN_EMAIL.`,
    );
    process.exitCode = 1;
  } else if (existing) {
    if (resetPassword) {
      existing.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
      existing.isBlocked = false;
      await existing.save();
      console.log(`✔ Password reset for admin ${env.ADMIN_EMAIL}`);
    } else {
      console.log(`✔ Admin ${env.ADMIN_EMAIL} already exists (no changes made).`);
    }
  } else {
    await User.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      phone: env.ADMIN_PHONE,
      passwordHash: await hashPassword(env.ADMIN_PASSWORD),
      role: "admin",
    });
    console.log(`✔ Admin account created: ${env.ADMIN_EMAIL}`);
  }

  await disconnectFromDatabase();
}

main().catch(async (error) => {
  console.error("✖ Seeding failed:", error instanceof Error ? error.message : error);
  await disconnectFromDatabase();
  process.exit(1);
});
