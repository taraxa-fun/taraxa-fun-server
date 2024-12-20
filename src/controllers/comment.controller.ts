import { Response } from "express";
import Request from "../types/Request";

import Comment, { IComment } from "../models/Comments";
import Token from "../models/Tokens";
import { EventEmitter } from "ws";

export const getCommentsOfToken = async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
        const token = await Token.findOne({
            address: address.toLowerCase()
        });

        if (!token) {
            return res.status(404).json({ message: "Token not found" });
        }

        const comments = await Comment.aggregate([
            {
                $match: {
                    token_address: token.address
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_wallet',
                    foreignField: 'wallet',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    content: 1,
                    likes: 1,
                    created_at: 1,
                    user: {
                        _id: 1,
                        username: 1,
                        wallet: 1,
                        avatar: 1
                    }
                }
            }
        ]);

        return res.status(200).json(comments);
    }

    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }
}

export const createComment = async (
    req: Request,
    res: Response,
    emitter: EventEmitter
) => {
    const { content, address } = req.body;

    try {

        const token = await Token.findOne({ address: address.toLowerCase() });

        if (!token) {
            return res.status(404).json({ message: "Token not found" });
        }

        token.replies_count += 1;

        await token.save();

        const comment: IComment = await Comment.create({
            content,
            token_address: token.address,
            user_wallet: req.userWallet
        });

        const tokenAggregated = await Token.aggregate([
            {
                $match: {
                    address: address.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_wallet',
                    foreignField: 'wallet',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    address: 1,
                    name: 1,
                    symbol: 1,
                    supply: 1,
                    description: 1,
                    twitter: 1,
                    telegram: 1,
                    website: 1,
                    max_buy: 1,
                    marketcap: 1,
                    created_at: 1,
                    image: 1,
                    repliesCount: 1,
                    user: {
                        username: '$user.username',
                        wallet: '$user.wallet',
                        avatar: '$user.avatar'
                    }
                }
            }
        ]);

        emitter.emit('commentCreated', tokenAggregated);

        return res.status(201).json(comment);
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }
};

export const addLike = async (req: Request, res: Response) => {
    const { commentId } = req.body;

    try {
        const comment: IComment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        comment.likes += 1;

        await comment.save();

        return res.status(200).json(comment);

    }

    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }

}

export const removeLike = async (req: Request, res: Response) => {
    const { commentId } = req.body;

    try {
        const comment: IComment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.likes > 0) comment.likes -= 1;

        await comment.save();

        return res.status(200).json(comment);

    }

    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }

}