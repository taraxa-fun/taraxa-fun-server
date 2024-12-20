import { verifyMessage } from 'viem'

const msg = "Sign in to Taraxa.fun:";

interface INonce {
    nonce: string;
    message: string;
}

export const createNonceAndMSG = () : INonce => {
    const randomNonce = Math.random().toString(36).substring(2, 15);
    return {
        nonce: randomNonce,
        message: `${msg} ${randomNonce}`
    };
};

export const verifySignature = async (signature: `0x${string}`, nonce: string, wallet: `0x${string}`): Promise<Boolean> => {

    console.log(nonce)

    try {
        const valid = await verifyMessage(
            {
                address: wallet,
                signature,
                message: `${msg} ${nonce}`
            }
        );

        return valid;
    }
    catch (error) {
        console.error('Error verifying signature:', error)
        return false;
    }
};  
