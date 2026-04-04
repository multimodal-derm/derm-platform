"use client";

import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useCallback, useState, useRef } from "react";

interface ImageUploadProps {
  image: File | null;
  preview: string | null;
  onImageSelect: (file: File, preview: string) => void;
  onImageClear: () => void;
}

export function ImageUpload({
  image,
  preview,
  onImageSelect,
  onImageClear,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelect(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (preview) {
    return (
      <div className="relative group">
        <div className="rounded-xl overflow-hidden border border-clinical-border bg-black/5">
          <img
            src={preview}
            alt="Uploaded dermoscopic image"
            className="w-full h-80 object-contain"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-clinical-muted">
            <ImageIcon className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{image?.name}</span>
            <span className="text-xs">
              ({((image?.size || 0) / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button
            onClick={onImageClear}
            aria-label="Remove uploaded image"
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload dermoscopic image. Click or drag and drop."
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        "relative flex flex-col items-center justify-center h-80 rounded-xl border-2 border-dashed cursor-pointer transition-all",
        isDragging
          ? "border-brand-500 bg-brand-50"
          : "border-gray-300 hover:border-brand-400 hover:bg-gray-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        aria-label="Select dermoscopic image file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors",
          isDragging ? "bg-brand-100" : "bg-gray-100",
        )}
      >
        <Upload
          className={cn(
            "w-6 h-6",
            isDragging ? "text-brand-600" : "text-clinical-muted",
          )}
        />
      </div>
      <p className="text-sm font-medium text-clinical-text mb-1">
        Drop dermoscopic image here
      </p>
      <p className="text-xs text-clinical-muted">
        JPEG or PNG, up to 10MB
      </p>
    </div>
  );
}
