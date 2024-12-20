import mongoose, { Document, model, Schema } from "mongoose";

export type CandleType = {
    open : number;
    high : number;
    low : number;
    close : number;
    volume : number;
    time : string;
    token_address : string;
};

export interface ICandle extends CandleType, Document { }

const candleSchema: Schema = new Schema({
    open: {
        type: String,
        required: true
    },
    high: {
        type: String,
        required: true
    },
    low: {
        type: String,
        required: true
    },
    close: {
        type: String,
        required: true
    },
    volume: {
        type: String,
        required: true
    },
    time : {
        type: String,
        required: true
    },
    token_address : {
        type: String,
        required: true
    }
});

candleSchema.index({ token_address: 1, time: 1 }, { unique: true });

const CandleStick1M = mongoose.model<ICandle>("CandleStick1M", candleSchema);

export default CandleStick1M;
