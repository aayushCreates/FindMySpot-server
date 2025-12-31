import { getJWT, getPasswordHash, validatePassword } from "../utils/auth.utils";
import { PrismaClient, User } from "@prisma/client";
const prisma = new PrismaClient();

export class AuthService {
  static async registerUser(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const { name, email, phone, password } = data;

    const hashedPassword = await getPasswordHash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    const token = await getJWT(user.id, user.email);

    return { user, token };
  }

  static async loginUser(data: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid Credentials");

    const isValid = await validatePassword(password, user.password);
    if (!isValid) throw new Error("Invalid Credentials");

    const token = await getJWT(user.id, user.email);

    return { user, token };
  }
}