// src/models.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRFP extends Document {
  title: string;
  description: string;
  budget?: number;
  deliveryTimeline?: string;
  items: Array<{ name: string; qty: number; specs?: string }>;
  paymentTerms?: string;
  warranty?: string;
  createdAt: Date;
  awardedVendorId?: mongoose.Types.ObjectId | null;
}

const ItemSchema = new Schema({
  name: String,
  qty: Number,
  specs: String,
});

const RFPSchema = new Schema<IRFP>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: Number,
  deliveryTimeline: String,
  items: [ItemSchema],
  paymentTerms: String,
  warranty: String,
  awardedVendorId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
  createdAt: { type: Date, default: Date.now },
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
