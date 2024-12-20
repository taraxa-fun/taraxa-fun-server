import { Response } from "express";
import path from 'path';

import { bucket } from "../config/gcloud";
import Token, { IToken } from "../models/Tokens";
import PumpEmperor from "../models/PumpEmperors";
import Request from "../types/Request";
import { validateImageContent } from "../utils/img-validation";

export const createToken = async (req: Request, res: Response) => {

    const {
        address,
        twitter,
        telegram,
        website,
        max_buy
    } = req.body;


    try {
        const token: IToken = await Token.findOne({ address: address.toLowerCase(), user_wallet: req.userWallet });
        if (token.is_initialized) {
            return res.status(400).json({ message: "Token already initialized" });
        }

        if (!token) {
            await Token.create({
                address: address.toLowerCase(),
                user_wallet: req.userWallet,
                twitter,
                telegram,
                website,
                max_buy
            });
        }
        else {
            token.twitter = twitter;
            token.telegram = telegram;
            token.website = website;
            token.max_buy = max_buy;
            token.is_initialized = true;
    
            await token.save();
        }

        return res.status(200).json({ message: "Token initialized" });

    } catch (error) {
        console.error('General error:', error);
        return res.status(500).json({
            message: "Server Error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getTokenByAddress = async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
        const token = await Token.aggregate([
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
                $lookup: {
                    from: 'trades',
                    let: { tokenAddress: '$address' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$token_address', '$$tokenAddress'] }
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
                        }
                    ],
                    as: 'trades'
                }
            },
            {
                $lookup: {
                    from: 'pumpemperors',
                    let: { tokenAddress: '$address' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$token_address', '$$tokenAddress'] }
                            }
                        },
                        {
                            $sort: { created_at: -1 }
                        },
                        {
                            $limit: 1
                        }
                    ],
                    as: 'pump_emperor'
                }
            },
            {
                $unwind: {
                    path: '$pump_emperor',
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
                    listed: 1,
                    pair_address: 1,
                    max_buy: 1,
                    marketcap: 1,
                    created_at: 1,
                    image: 1,
                    replies_count: 1,
                    pump_emperor : '$pump_emperor.created_at',
                    user: {
                        username: '$user.username',
                        wallet: '$user.wallet',
                        avatar: '$user.avatar'
                    },
                    trades: {
                        type: 1,
                        outAmount: 1,
                        inAmount: 1,
                        index: 1,
                        hash: 1,
                        created_at: 1,
                        user: {
                            username: '$user.username',
                            wallet: '$user.wallet',
                            avatar: '$user.avatar'
                        }
                    }
                }
            }
        ]);

        if (!token[0]) {
            return res.status(404).json({ message: "Token not found" });
        }

        return res.status(200).json(token[0]);

    } catch (error) {
        console.error('Error in getTokenByAddress:', error);
        return res.status(500).json({
            message: "Server Error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getAllTokens = async (req: Request, res: Response) => {

    const MAX_ITEMS_PER_PAGE = 30;

    const {
        sortby,
        page,
        limit,
        search
    } = req.query;

    try {

        const currentPage = Math.max(1, Number.isNaN(parseInt(page as string)) ? 1 : parseInt(page as string));
        const itemsPerPage = Math.min(
            Number.isNaN(parseInt(limit as string)) ? MAX_ITEMS_PER_PAGE : parseInt(limit as string),
            MAX_ITEMS_PER_PAGE
        );

        const skip = Number.isNaN(currentPage) || Number.isNaN(itemsPerPage) ?
            0 : (currentPage - 1) * itemsPerPage;

        let query: any = {};
        if (search) {
            query.$or = [
                { name: new RegExp(search as string, 'i') },
                { symbol: new RegExp(search as string, 'i') }
            ];
        }

        let tokens;
        switch (sortby) {
            case 'last-trade':
                console.log('last-trade');
                tokens = await Token.aggregate([
                    { $match: query },
                    // Lookup user
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
                    // Lookup trades
                    {
                        $lookup: {
                            from: 'trades',
                            let: { tokenAddress: '$address' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ['$token_address', '$$tokenAddress'] }
                                    }
                                }
                            ],
                            as: 'trades'
                        }
                    },
                    {
                        $addFields: {
                            lastTrade: {
                                $ifNull: [{ $max: '$trades.created_at' }, new Date(0)]
                            }
                        }
                    },
                    { $sort: { lastTrade: -1 } },
                    { $skip: skip },
                    { $limit: itemsPerPage },
                    {
                        $project: {
                            _id: 1,
                            address: 1,
                            created_at: 1,
                            description: 1,
                            name: 1,
                            supply: 1,
                            symbol: 1,
                            marketcap: 1,
                            twitter: 1,
                            listed: 1,
                            pair_address: 1,
                            telegram: 1,
                            website: 1,
                            max_buy: 1,
                            image: 1,
                            replies_count: 1,
                            user: {
                                _id: '$user._id',
                                username: '$user.username',
                                wallet: '$user.wallet',
                                avatar: '$user.avatar'
                            }
                        }
                    }
                ]);
                break;

            case 'last-comment':
                tokens = await Token.aggregate([
                    { $match: query },
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
                        $lookup: {
                            from: 'comments',
                            let: { tokenAddress: '$address' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ['$token_address', '$$tokenAddress'] }
                                    }
                                }
                            ],
                            as: 'comments'
                        }
                    },
                    {
                        $addFields: {
                            lastComment: {
                                $ifNull: [{ $max: '$comments.created_at' }, new Date(0)]
                            }
                        }
                    },
                    { $sort: { lastComment: -1 } },
                    { $skip: skip },
                    { $limit: itemsPerPage },
                    {
                        $project: {
                            _id: 1,
                            address: 1,
                            created_at: 1,
                            description: 1,
                            name: 1,
                            supply: 1,
                            symbol: 1,
                            marketcap: 1,
                            twitter: 1,
                            listed: 1,
                            pair_address: 1,
                            telegram: 1,
                            website: 1,
                            max_buy: 1,
                            image: 1,
                            replies_count: 1,
                            user: {
                                _id: '$user._id',
                                username: '$user.username',
                                wallet: '$user.wallet',
                                avatar: '$user.avatar'
                            }
                        }
                    }
                ]);
                break;

            case 'marketcap':
                tokens = await Token.aggregate([
                    { $match: query },
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
                        $addFields: {
                            marketcapNum: {
                                $toDouble: '$marketcap'
                            }
                        }
                    },
                    { $sort: { marketcapNum: -1 } },
                    { $skip: skip },
                    { $limit: itemsPerPage },
                    {
                        $project: {
                            _id: 1,
                            address: 1,
                            created_at: 1,
                            description: 1,
                            name: 1,
                            supply: 1,
                            symbol: 1,
                            marketcap: 1,
                            listed: 1,
                            pair_address: 1,
                            twitter: 1,
                            telegram: 1,
                            website: 1,
                            max_buy: 1,
                            image: 1,
                            replies_count: 1,
                            user: {
                                _id: '$user._id',
                                username: '$user.username',
                                wallet: '$user.wallet',
                                avatar: '$user.avatar'
                            }
                        }
                    }
                ]);
                break;

            case 'created-at':
            default:
                tokens = await Token.aggregate([
                    { $match: query },
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
                    { $sort: { created_at: -1 } },
                    { $skip: skip },
                    { $limit: itemsPerPage },
                    {
                        $project: {
                            _id: 1,
                            address: 1,
                            created_at: 1,
                            description: 1,
                            name: 1,
                            supply: 1,
                            symbol: 1,
                            listed: 1,
                            pair_address: 1,
                            marketcap: 1,
                            twitter: 1,
                            telegram: 1,
                            website: 1,
                            max_buy: 1,
                            image: 1,
                            replies_count: 1,
                            user: {
                                _id: '$user._id',
                                username: '$user.username',
                                wallet: '$user.wallet',
                                avatar: '$user.avatar'
                            }
                        }
                    }
                ]);
                break;
        }

        const totalTokens = await Token.countDocuments(query);
        const totalPages = Math.ceil(totalTokens / itemsPerPage);

        res.json({
            success: true,
            data: {
                tokens,
                pagination: {
                    total: totalTokens,
                    currentPage,
                    totalPages,
                    itemsPerPage,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            }
        });


    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }

};

export const uploadImage = async (req: Request, res: Response) => {

    const { address } = req.body;

    const addressLower = address.toLowerCase();

    try {

        const token = await Token.findOne({ address: addressLower, user_wallet: req.userWallet });

        if (!token) {
            return res.status(404).json({
                message: "Token not found"
            });
        }

        if (token.image) {
            return res.status(400).json({
                message: "Image already uploaded"
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file to upload' });
        }

        const validationResult = await validateImageContent(req.file.buffer);

        if (!validationResult.safe) {
            return res.status(400).json({
                message: "Image not safe",
                error: validationResult.reason || 'Content not safe'
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
            res.status(500).json({
                message: "Error during upload",
                error: error
            });
        });

        stream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            token.image = publicUrl;

            await token.save();

            res.status(200).json({
                message: "Image uploaded",
                url: publicUrl
            });
        });

        stream.end(req.file.buffer);

    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getPumpEmperor = async (req: Request, res: Response) => {
    try {
        const latestPump = await PumpEmperor.aggregate([
            { $sort: { created_at: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'tokens',
                    localField: 'token_address',
                    foreignField: 'address',
                    as: 'token'
                }
            },
            {
                $unwind: {
                    path: '$token',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'token.user_wallet',
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
                    token_address: 1,
                    total_volume: 1,
                    created_at: 1,
                    token: {
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
                        image: 1,
                        repliesCount: 1,
                        user: {
                            username: '$user.username',
                            wallet: '$user.wallet',
                            avatar: '$user.avatar'
                        }
                    }
                }
            }
        ]);

        if (latestPump.length === 0) {
            return res.status(200).json({});
        }

        return res.status(200).json(latestPump[0]);
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }
};