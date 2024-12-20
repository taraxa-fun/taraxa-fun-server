import { Document, model, Schema } from "mongoose";

export type MigrationType = {
    token: Object;
    pair: string;
    hash: string;
    created_at: Date;
};

export interface IMigration extends MigrationType, Document { }

const MigrationSchema: Schema = new Schema({
    token : {
        type : Schema.Types.ObjectId, ref : 'Token'
    },
    pair : {
        type : String,
        required : true
    },
    hash : {
        type : String,
        required : true
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

const Migration = model<IMigration>("Migration", MigrationSchema);

export default Migration;
