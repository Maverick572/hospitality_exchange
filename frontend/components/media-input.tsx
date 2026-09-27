"use client";

import { useRef, useState } from "react";
import { ImagePlusIcon, LinkIcon, StarIcon, UploadCloudIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { uploadFile } from "@/lib/firebase";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  folder: string;
  accept?: string;
  max?: number;
};

/**
 * Product & resource media photo uploader.
 * Stores photos in Firebase Storage if configured, or encodes optimized images
 * directly into the Firestore document payload.
 */
export function MediaInput({ value, onChange, folder, accept = "image/*", max = 6 }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const remainingSlots = Math.max(0, max - value.length);
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const uploaded: string[] = [];

      for (const file of selectedFiles) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          throw new Error("Please select valid image or video files.");
        }
        const uploadedUrl = await uploadFile(file, folder);
        uploaded.push(uploadedUrl);
      }

      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addUrl() {
    const link = url.trim();
    if (!link) return;
    try {
      new URL(link);
    } catch {
      setError("Please enter a valid full URL (e.g. https://example.com/photo.jpg)");
      return;
    }
    onChange([...value, link]);
    setUrl("");
    setShowUrlInput(false);
    setError(null);
  }

  function setAsCover(index: number) {
    if (index === 0) return;
    const target = value[index];
    const rest = value.filter((_, i) => i !== index);
    onChange([target, ...rest]);
  }

  function removePhoto(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Uploaded Photos Preview Grid ── */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {value.map((src, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-2xs"
            >
              {/\.(mp4|webm|mov)(\?|$)/i.test(src) ? (
                <video src={src} className="size-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`Product photo ${index + 1}`} className="size-full object-cover" />
              )}

              {/* Cover Photo Badge */}
              {index === 0 ? (
                <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground backdrop-blur-xs shadow-xs">
                  <StarIcon className="size-2.5 fill-current" /> Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAsCover(index)}
                  className="absolute top-1.5 left-1.5 rounded-md bg-background/80 px-1.5 py-0.5 text-[9px] font-semibold text-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100 hover:bg-background"
                >
                  Set as cover
                </button>
              )}

              {/* Remove Photo Button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100"
                aria-label="Remove photo"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Dropzone & Upload Actions ── */}
      {value.length < max && (
        <div className="space-y-2">
          <input
            ref={fileInput}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInput.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-foreground/30 hover:bg-muted/30"
            }`}
          >
            {uploading ? (
              <div className="flex items-center gap-2 py-2 text-xs font-semibold text-muted-foreground">
                <Spinner className="size-4" /> Processing & saving photo...
              </div>
            ) : (
              <>
                <div className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1.5">
                  <UploadCloudIcon className="size-4" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  Click to upload product photo <span className="text-muted-foreground font-normal">or drag & drop</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  JPG, PNG, WebP up to {max - value.length} more {max - value.length === 1 ? "photo" : "photos"}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span className="text-[11px]">Photos will be saved directly in Firestore with your listing</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-primary hover:underline"
            >
              {showUrlInput ? "Hide URL input" : "+ Add image via URL"}
            </button>
          </div>

          {showUrlInput && (
            <div className="flex gap-1.5 pt-1">
              <div className="relative flex-1">
                <LinkIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                  placeholder="Paste image link (https://...)"
                  className="pl-8 text-xs h-8"
                />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addUrl} disabled={!url.trim()} className="h-8 text-xs">
                Add URL
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
