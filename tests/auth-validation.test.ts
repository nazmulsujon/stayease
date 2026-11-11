import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/validations/auth";

const valid = {
  name: "  Ayesha Rahman ",
  email: "  Ayesha@Example.COM ",
  phone: "+880 1712-345678",
  password: "secret123",
  confirmPassword: "secret123",
};

const errorsOf = (input: unknown) => {
  const r = registerSchema.safeParse(input);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
};

describe("registerSchema (FR-AUTH-01)", () => {
  it("accepts valid input and normalises it", () => {
    const data = registerSchema.parse(valid);
    expect(data.name).toBe("Ayesha Rahman");
    expect(data.email).toBe("ayesha@example.com");
    expect(data.phone).toBe("01712345678");
  });

  it.each([
    ["email", { email: "not-an-email" }],
    ["phone", { phone: "12345" }],
    ["phone", { phone: "01212345678" }], // invalid operator prefix
    ["password", { password: "short1", confirmPassword: "short1" }],
    ["password", { password: "onlyletters", confirmPassword: "onlyletters" }],
    ["password", { password: "12345678", confirmPassword: "12345678" }],
    ["confirmPassword", { confirmPassword: "different1" }],
    ["name", { name: "A" }],
  ])("rejects invalid %s", (field, override) => {
    expect(errorsOf({ ...valid, ...override })).toHaveProperty(field);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", () => {
    const long = "a1".repeat(40);
    expect(errorsOf({ ...valid, password: long, confirmPassword: long })).toHaveProperty("password");
  });
});

describe("loginSchema (FR-AUTH-04)", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });
  it("lower-cases the email", () => {
    expect(loginSchema.parse({ email: "A@B.CO", password: "x" }).email).toBe("a@b.co");
  });
});
