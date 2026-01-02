import crypto from "crypto";

export const verifySignature = (body: any, signature: string) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(JSON.stringify(body))
    .digest("hex");

  return expectedSignature === signature;
};