import { Response } from "express";
import Request from "../types/Request";
import CandleStick1M, { ICandle } from "../models/CandleSticks1M";


export const getAllCandles = async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
        const candles: ICandle[] = await CandleStick1M.find({
            token_address: address
        }).sort({ time: -1 });

        if (!candles) {
            return res.status(404).json({
                message: "Candles not found"
            });
        }

        return res.status(200).json(candles);

    }
    catch (error) {
        return res.status(500).json({ message: "Server Error", error: error });
    }

}