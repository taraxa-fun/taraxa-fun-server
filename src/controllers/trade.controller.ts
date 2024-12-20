import { Request, Response } from 'express';
import Trade from "../models/Trades";

const MAX_LIMIT = 20;

export const getLatestTrades = async (req: Request, res: Response) => {
    const { limit } = req.query;
 
    if (!limit || isNaN(parseInt(limit as string))) {
        return res.status(400).json({
            success: false,
            message: "Invalid limit parameter"
        });
    }
 
    const limitValue = parseInt(limit as string);
 
    try {
        const trades = await Trade.aggregate([
            { $sort: { created_at: -1 } },
            { $limit: limitValue > MAX_LIMIT ? MAX_LIMIT : limitValue },
            
            // Lookup users (users)
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
            
            // Lookup tokens
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
                $project: {
                    type: 1,
                    outAmount: 1,
                    inAmount: 1,
                    index: 1,
                    hash: 1,
                    created_at: 1,
                    user: {
                        _id: 1,
                        wallet: 1,
                        username: 1,
                        avatar: 1
                    },
                    token: {
                        _id: 1,
                        address: 1,
                        name: 1,
                        symbol: 1,
                        image: 1
                    }
                }
            }
        ]);
 
        res.status(200).json({
            success: true,
            data: trades
        });
 
    } catch (error) {
        console.error('Error in getLatestTrades:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to fetch latest trades",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
 };