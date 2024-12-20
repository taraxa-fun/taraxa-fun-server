import mongoose, { Document, model, Schema } from "mongoose";

export type CommentType = {
   user_wallet: string;
   token_address: string;
   content: string;
   likes: number;
   created_at: Date;
};

export interface IComment extends CommentType, Document { }

const CommentSchema: Schema = new Schema({
   content: {
       type: String,
       required: true
   },
   likes: {
       type: Number,
       default: 0
   },
   user_wallet: {
       type: String,
       required: true,
       index: true,
       set: (wallet: string) => wallet.toLowerCase()
   },
   token_address: {
       type: String,
       required: true,
       index: true,
       set: (address: string) => address.toLowerCase()
   },
   created_at: {
       type: Date,
       default: Date.now,
   }
});

const Comment = mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;