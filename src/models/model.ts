// src/models.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRFP extends Document {
  rfpId: string; // RFP-20231026-ABCD format
  title: string;
  description: string;
  budget?: number;
  deliveryTimeline?: string;
  items: Array<{ name: string; qty: number; spec?: string }>;
  paymentTerms?: string;
  warranty?: string;
  sentTo: Array<{ email: string; name: string }>;
  status: "pending" | "awarded" | "closed";
  awardedTo?: { email: string; name: string };
  createdAt: Date;
  awardedVendorId?: mongoose.Types.ObjectId | null;
}

const ItemSchema = new Schema({
  name: String,
  qty: Number,
  spec: String,
});

const RecipientSchema = new Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
});

const RFPSchema = new Schema<IRFP>({
  rfpId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  budget: Number,
  deliveryTimeline: String,
  items: [ItemSchema],
  paymentTerms: String,
  warranty: String,
  sentTo: [RecipientSchema],
  status: {
    type: String,
    enum: ["pending", "awarded", "closed"],
    default: "pending",
  },
  awardedTo: RecipientSchema,
  createdAt: { type: Date, default: Date.now },
  awardedVendorId: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
    default: null,
  },
});

export const RFP = mongoose.model<IRFP>("RFP", RFPSchema);

// ---------------- Vendors ----------------
export interface IVendor extends Document {
  name: string;
  email: string;
  meta?: Record<string, any>;
}

const VendorSchema = new Schema<IVendor>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  meta: Schema.Types.Mixed,
});

export const Vendor = mongoose.model<IVendor>("Vendor", VendorSchema);

// ---------------- Proposals ----------------
export interface IProposal extends Document {
  rfpId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  vendorEmail?: string;
  vendorName?: string;
  rawEmail?: string;
  totalPrice?: number;
  breakdown?: Record<string, any>;
  delivery?: string;
  warranty?: string;
  paymentTerms?: string;
  parsedAt?: Date;
}

const ProposalSchema = new Schema<IProposal>({
  rfpId: { type: Schema.Types.ObjectId, ref: "RFP", required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
  vendorEmail: String,
  vendorName: String,
  rawEmail: String,
  totalPrice: Number,
  breakdown: Schema.Types.Mixed,
  delivery: String,
  warranty: String,
  paymentTerms: String,
  parsedAt: Date,
});

export const Proposal = mongoose.model<IProposal>("Proposal", ProposalSchema);
