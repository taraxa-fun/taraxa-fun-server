import mongoose, { Document, model, Schema } from "mongoose";

export type TradeType = {
    user_wallet: String;
    token_address: String;
    type: string;
    outAmount: string;
    inAmount: string;
    index: string;
    hash: string;
    created_at: Date;
};

export interface ITrade extends TradeType, Document { }

const tradeSchema: Schema = new Schema({
    type: {
        type: String,
        required: true
    },
    outAmount: {
        type: String,
        required: true
    },
    inAmount: {
        type: String,
        required: true
    },
    index: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    user_wallet: {
        type: String,
        required: true,
        index: true,
        set : (wallet: string) => wallet.toLowerCase()
    },
    token_address: {
        type: String,
        required: true,
        set : (address: string) => address.toLowerCase()
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const Trade = mongoose.model<ITrade>("Trade", tradeSchema);

export default Trade;
