import { z } from "zod";
import { guideBody } from "./schema";

// Gemini can reject the cross-product of nested array and scalar constraints.
// Ask it for the shape; enforce every original bound with guideBody.parse below.
const runtimeOnly = new Set([
  "minLength", "maxLength", "minItems", "maxItems", "minimum", "maximum",
  "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "pattern", "format",
]);
function shapeOnly(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shapeOnly);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !runtimeOnly.has(key)).map(([key, child]) => [key, shapeOnly(child)]));
  }
  return value;
}

export const providerGuideSchema = shapeOnly(z.toJSONSchema(guideBody, { target: "draft-7" })) as Record<string, unknown>;
