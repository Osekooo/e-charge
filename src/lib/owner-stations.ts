import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StationRow = Database["public"]["Tables"]["stations"]["Row"];
export type StationInsert = Database["public"]["Tables"]["stations"]["Insert"];

export type DayHours = { day: string; open: string; close: string; closed: boolean; allDay: boolean };

export const POST_AUTH_KEY = "echarge_post_auth_redirect";

export const reviewStatusLabels: Record<StationRow["review_status"], string> = {
  pending: "Awaiting verification",
  approved: "E-Charge Verified",
  rejected: "Not approved",
  suspended: "Suspended",
};

/** Resize an image in the browser so uploads stay small (max 1600px, JPEG). */
export async function resizeImage(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/jpeg", 0.82),
  );
}

export async function uploadStationPhoto(userId: string, file: File): Promise<string> {
  const blob = await resizeImage(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("station-photos")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

export async function signedPhotoUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data } = await supabase.storage.from("station-photos").createSignedUrls(paths, 3600);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}
