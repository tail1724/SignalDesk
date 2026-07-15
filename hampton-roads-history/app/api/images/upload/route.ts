import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateImagePath } from "@/lib/images";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getFileExtension(mimeType: string): string {
  const ext = mimeType.split("/")[1];
  return ext === "jpeg" ? "jpg" : ext;
}

/**
 * Verify the actual leading bytes of the upload match the declared image type,
 * so a caller can't smuggle a non-image (or a mismatched type) past the
 * Content-Type check. Returns true when the magic number matches `declaredType`.
 */
function magicBytesMatch(bytes: Uint8Array, declaredType: string): boolean {
  switch (declaredType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    case "image/webp":
      // "RIFF" .... "WEBP"
      return (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authorization: uploads require an authenticated session. This endpoint
    // writes to the shared hr-images bucket, so it must never be anonymous.
    // (Editor/role-scoped authorization is a follow-up once the Payload RBAC +
    // integration-account workstream lands.)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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

    // Content validation: the declared Content-Type is caller-controlled, so
    // confirm the real file signature before trusting it.
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!magicBytesMatch(header, file.type)) {
      return NextResponse.json(
        { error: "File contents do not match the declared image type" },
        { status: 400 }
      );
    }

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
  } catch {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
