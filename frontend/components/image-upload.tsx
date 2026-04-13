"use client";

import { cn } from "@/lib/utils";
// Premium Phosphor Imports
import {
  ApertureIcon,
  XCircleIcon,
  FileImageIcon,
  CloudArrowUpIcon,
} from "@phosphor-icons/react";
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
      <div className="relative group animate-in fade-in zoom-in-95 duration-300">
        <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/20 backdrop-blur-sm">
          <img
            src={preview}
            alt="Uploaded dermoscopic image"
            className="w-full h-80 object-contain p-2"
          />
          {/* Subtle Overlay on hover */}
          <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground bg-background px-3 py-1 rounded-full border border-border/50 shadow-xl">
              Source Locked
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
              <FileImageIcon weight="duotone" className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold truncate max-w-[150px] text-foreground">
                {image?.name}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tight">
                {((image?.size || 0) / (1024 * 1024)).toFixed(2)} MB // RAW
              </span>
            </div>
          </div>
          <button
            onClick={onImageClear}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircleIcon weight="duotone" className="size-4" />
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center h-80 rounded-[2rem] border-2 border-dashed transition-all duration-300 group",
        isDragging
          ? "border-foreground bg-muted/10 scale-[0.99]"
          : "border-border/60 bg-muted/5 hover:border-foreground/40 hover:bg-muted/10",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
      
      <div className={cn(
        "size-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-sm",
        isDragging ? "bg-foreground text-background" : "bg-background text-foreground/40 border border-border/50 group-hover:text-foreground group-hover:border-foreground/20"
      )}>
        {isDragging ? (
          <CloudArrowUpIcon weight="duotone" className="size-8 animate-bounce" />
        ) : (
          <ApertureIcon weight="duotone" className="size-8" />
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-bold tracking-tight text-foreground">
          Import Dermoscopic Data
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Drop file or click to browse
        </p>
      </div>

      <div className="absolute bottom-6 flex gap-4 opacity-40">
         <span className="font-mono text-[9px] uppercase tracking-tighter">JPEG</span>
         <span className="font-mono text-[9px] uppercase tracking-tighter">PNG</span>
         <span className="font-mono text-[9px] uppercase tracking-tighter">MAX 10MB</span>
      </div>
    </div>
  );
}