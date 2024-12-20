import mongoose, { Document, model, Schema } from "mongoose";

export type TokenType = {
    address: string;
    name: string;
    symbol: string;
    supply: number;
    description: string;
    twitter: string;
    telegram: string;
    image: string;
    initial_price: string;
    website: string;
    max_buy: number;
    listed: boolean;
    pair_address: string;
    is_initialized: boolean;
    user_wallet: String;
    replies_count: number;
    created_at: Date;
};

export interface IToken extends TokenType, Document { }

const TokenSchema: Schema = new Schema({
    address: {
        type: String,
        required: false,
        set: (address: string) => address.toLowerCase()
    },
    name: {
        type: String,
        required: false
    },
    symbol: {
        type: String,
        required: false
    },
    supply: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    image : {
        type: String,
        required: false
    },
    twitter: {
        type: String,
        required: false
    },
    telegram: {
        type: String,
        required: false
    },
    replies_count : {
        type: Number,
        default : 0
    },
    website: {
        type: String,
        required: false
    },
    max_buy: {
        type: String,
        required: false
    },
    marketcap: {
        type: String,
        required: false
    },
    initial_price: {
        type: String,
        required: false
    },
    is_initialized: {
        type: Boolean,
        required: false,
        default: false
    },
    user_wallet: {
        type: String,
        required: true,
        index: true
    },
    listed : {
        type: Boolean,
        default : false
    },
    pair_address: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const Token = mongoose.model<IToken>("Token", TokenSchema);

export default Token;
