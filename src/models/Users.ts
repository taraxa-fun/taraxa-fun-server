import mongoose, { Document, model, Schema } from "mongoose";

export type UserType = {
  wallet: string;
  username: string;
  avatar: string;
  nonce: string;
  created_at: Date;
  updated_at: Date;
};

export interface IUser extends UserType, Document { }

const userSchema: Schema = new Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    index: true,
    set: (wallet: string) => wallet.toLowerCase()
  },
  username: {
    type: String,
    required: false,
    unique: false, // update ?
    trim: true
  },
  nonce: {
    type: String,
    required: false,
  },
  avatar: {
    type: String,
    required: false,
  },
  description : {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

export const User = mongoose.model<IUser>('User', userSchema);

export default User;
