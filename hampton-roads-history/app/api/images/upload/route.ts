import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateImagePath } from "@/lib/images";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getFileExtension(mimeType: string): string {
  const ext = mimeType.split("/")[1];
  return ext === "jpeg" ? "jpg" : ext;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: 10MB` },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Generate unique filename with UUID
    const uuid = crypto.randomUUID();
    const ext = getFileExtension(file.type);
    const storagePath = generateImagePath(uuid, ext);

    // Upload to Supabase
    const { error } = await supabase.storage
      .from("hr-images")
      .upload(storagePath, file, {
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: storagePath,
      filename: file.name,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
