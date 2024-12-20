import { Response } from "express";
import Request from "../types/Request";
import path from 'path';

import Token, { IToken } from "../models/Tokens";
import Comments, { IComment } from "../models/Comments";
import User, { IUser } from "../models/Users";
import Trade, { ITrade } from "../models/Trades";

import { bucket } from "../config/gcloud";
import { validateImageContent } from "../utils/img-validation";

export const getUserMe = async (req: Request, res: Response) => {
    try {
        const user: IUser | null = await User.findOne({ wallet: req.userWallet });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const userComments: IComment[] = await Comments.find({ user_wallet: user.wallet });

        const userTokens: IToken[] = await Token.find({ user_wallet: user.wallet });

        const userTrades: ITrade[] = await Trade.find({ user_wallet: user.wallet });

        const userData = {
            user: user,
            comments: userComments,
            tokens: userTokens,
            trades: userTrades
        }

        return res.status(200).json(userData);
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }

}

export const updateUserMe = async (req: Request, res: Response) => {

    const { username, description, avatar } = req.body;

    try {
        const user: IUser | null = await User.findOneAndUpdate(
            { wallet: req.userWallet },
            { $set: { username, description, avatar } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User successfully updated",
            user: user
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }
}

export const deleteUserMe = async (req: Request, res: Response) => {
    try {
        const user: IUser | null = await User.findOneAndDelete({ wallet: req.userWallet });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User successfully deleted",
            user: user
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }
}

export const uploadAvatar = async (req: Request, res: Response) => {
    try {

        const user = await User.findOne({ wallet: req.userWallet });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!req.file) {
            return res.status(400).json({ message : "No file uploaded"});
        }

        try {
            const validationResult = await validateImageContent(req.file.buffer);

            if (!validationResult.safe) {
                return res.status(400).json({
                    message : 'Image content not safe',
                    error: validationResult
                });
            }
        } catch (error) {
            return res.status(500).json({
                message : 'Error during image content validation',
                error: error
            });
        }

        const fileExt = path.extname(req.file.originalname).toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
        const file = bucket.file(fileName);

        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
            resumable: false
        });

        stream.on('error', (error) => {
            console.error('Erreur upload:', error);
            res.status(500).json({ 
                message : "Server Error",
                error: error
             });
        });

        stream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

            user.avatar = publicUrl;
            await user.save();

            res.status(200).json({
                success: true,
                url: publicUrl
            });
        });

        stream.end(req.file.buffer);

    } catch (error) {
        console.error('Erreur générale:', error);
        res.status(500).json({ 
            message : "Server Error",
            error: error
         });
    }
};

export const getUserByAddress = async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
        const user: IUser | null = await User.findOne({
            wallet: (address).toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        const userComments: IComment[] = await Comments.find({ user: user._id });

        const userTokens: IToken[] = await Token.find({ user: user._id });

        const userTrades: ITrade[] = await Trade.find({ user: user._id });

        const userData = {
            user: user,
            comments: userComments,
            tokens: userTokens,
            trades: userTrades
        }

        return res.status(200).json(userData);

    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }

}

export const getUserByUsername = async (req: Request, res: Response) => {
    const { username } = req.params;

    try {
        const user: IUser | null = await User.findOne
            ({
                username: username
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const userComments: IComment[] = await Comments.find({ user_wallet: user.wallet });

        const userTokens: IToken[] = await Token.find({ user_wallet: user.wallet });

        const userTrades: ITrade[] = await Trade.find({ user_wallet: user.wallet });

        const userData = {
            user: user,
            comments: userComments,
            tokens: userTokens,
            trades: userTrades
        }

        return res.status(200).json(userData);

    }

    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }

}
