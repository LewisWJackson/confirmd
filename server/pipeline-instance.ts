import { VerificationPipeline } from "./pipeline.js";
import { storage } from "./storage.js";

export const pipeline = new VerificationPipeline(storage);
