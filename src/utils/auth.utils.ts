import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const getPasswordHash = async (plainTextPassword: string)=> {
    const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

    return hashedPassword;
}

export const validatePassword = async (plainTextPassword: string, hashedPassword: string)=> {
    const isValidPassword = await bcrypt.compare(plainTextPassword, hashedPassword);

    return isValidPassword;
}

export const getJWT = async (id: string, email: string)=> {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const jwtToken = jwt.sign({ id, email }, secretKey, { expiresIn: '7d' });

    return jwtToken;
}

export const validateToken = async (token: string)=> {
    const secretKey = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secretKey) as JwtPayload;

    return {
        id: decoded?.id as string,
        email: decoded?.email as string
    }
}