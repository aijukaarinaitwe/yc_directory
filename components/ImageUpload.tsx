"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/actions";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ImageUploadProps {
  name: string;
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  error?: string;
}

const ImageUpload = ({
  name,
  value,
  onChange,
  onUploadingChange,
  error,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please choose an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Images must be 5MB or smaller",
          variant: "destructive",
        });
        return;
      }

      setPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });

      setIsUploading(true);
      onUploadingChange?.(true);

      try {
        const body = new FormData();
        body.append("file", file);

        const result = await uploadImage(body);

        if (result.status === "SUCCESS") {
          onChange(result.url);
        } else {
          throw new Error(result.error || "Upload failed");
        }
      } catch (err) {
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive",
        });
        setPreview(null);
        onChange("");
      } finally {
        setIsUploading(false);
        onUploadingChange?.(false);
      }
    },
    [onChange, onUploadingChange, toast],
  );

  const handleRemove = () => {
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input type="hidden" name={name} value={value} readOnly />

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload startup image"
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onPaste={(e) => {
          const item = Array.from(e.clipboardData.items).find((i) =>
            i.type.startsWith("image/"),
          );
          void handleFile(item?.getAsFile());
        }}
        className={cn(
          "mt-3 flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border-[3px] border-dashed p-5 text-center transition-colors",
          isDragging ? "border-primary bg-primary-100" : "border-black",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Startup image preview"
              className="max-h-[160px] w-auto rounded-[10px] object-cover"
            />

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-white/70">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}

            {!isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-black text-white"
                aria-label="Remove image"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            <ImageUp className="size-10 text-black-300" />
            <p className="font-medium text-black-300">
              Drag & drop, paste, or click to choose an image
            </p>
            <p className="text-sm text-black-300">PNG, JPG or GIF, up to 5MB</p>
          </>
        )}
      </div>

      {error && <p className="startup-form_error">{error}</p>}
    </div>
  );
};

export default ImageUpload;
