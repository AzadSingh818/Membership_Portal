import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_dev_secret"

export function generateJWT(payload: any, role: string): string {
  return jwt.sign(
    {
      ...payload,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  )
}
