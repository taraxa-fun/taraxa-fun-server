import { Request, Response } from "express";
import { createNonceAndMSG, verifySignature } from "../utils/signature";
import User, { IUser } from "../models/Users";

import jwt from "jsonwebtoken";

export const signIn = async (req: Request, res: Response) => {
    const { wallet, signature } = req.body;

    try {
        const user: IUser = await User.findOne({ wallet: wallet });
        if (!user) return res.status(401).json({ message: "User not registered" });

        const signatureValid = await verifySignature(signature, user.nonce, wallet);
        if (!signatureValid) return res.status(401).json({ message: "Invalid signature" });

        const token = jwt.sign({ userWallet: user.wallet }, process.env.JWT_SECRET, { expiresIn: 3600 });

        res.status(200).json({ message: "Success", token: token });
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error : error });
    }
};

export const getNonce = async (req: Request, res: Response) => {
    const { wallet } = req.params;

    const user: IUser = await User.findOne({ wallet: wallet });

    const nonce_msg = createNonceAndMSG();

    if (!user) {

        const newUser = new User({
            wallet : wallet,
            nonce: nonce_msg.nonce,
            username: wallet.substring(0, 6),
        });

        await newUser.save();

        return res.status(201).json({ nonce: `${nonce_msg.message}` });
    }

    user.nonce = nonce_msg.nonce;

    await user.save();

    res.status(200).json({ nonce: `${nonce_msg.message}` });
};