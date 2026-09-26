"use client";

import { useRef, useState } from "react";
import { ImagePlusIcon, LinkIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { storageEnabled, uploadFile } from "@/lib/firebase";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  folder: string;
  accept?: string;
  max?: number;
};

/**
 * Photos/videos as URLs. With Firebase Storage configured, files upload and
 * their download URL is stored; without it, paste a link instead.
 */
export function MediaInput({ value, onChange, folder, accept = "image/*", max = 6 }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, max - value.length)) {
        uploaded.push(await uploadFile(file, folder));
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
      setError("That doesn't look like a full link (https://…).");
      return;
    }
    onChange([...value, link]);
    setUrl("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((src) => (
            <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {/\.(mp4|webm|mov)(\?|$)/i.test(src) ? (
                <video src={src} className="size-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="size-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== src))}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/90 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Remove"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <div className="flex gap-1.5">
          {storageEnabled && (
            <>
              <input
                ref={fileInput}
                type="file"
                accept={accept}
                multiple
                className="hidden"
                onChange={(e) => void handleFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Spinner data-icon="inline-start" /> : <ImagePlusIcon data-icon="inline-start" />}
                Upload
              </Button>
            </>
          )}
          <div className="relative flex-1">
            <LinkIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder={storageEnabled ? "…or paste a link" : "Paste an image link"}
              className="pl-8"
            />
          </div>
          <Button type="button" variant="outline" onClick={addUrl} disabled={!url.trim()}>
            Add
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
