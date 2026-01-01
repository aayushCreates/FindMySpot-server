import crypto from 'crypto';

export const getIdempotencyKey = (slotId: string, userId: string)=> {

    const key = crypto.createHash("sha256").update(
        JSON.stringify({
            slotId: slotId,
            userId: userId
        })
    ).digest("hex");

    return key;
}
