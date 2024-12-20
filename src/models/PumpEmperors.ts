import mongoose, { Document, Schema } from "mongoose";

export type PumpEmperorType = {
    token_address: string;
    totalVolume: string;
    created_at: Date;
};

export interface IPumpEmperor extends PumpEmperorType, Document { }

const PumpEmperorSchema: Schema = new Schema({
    token_address: {
        type: String,
        required: true
    },
    total_volume: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

const PumpEmperor = mongoose.model<IPumpEmperor>("PumpEmperor", PumpEmperorSchema);

export default PumpEmperor;
