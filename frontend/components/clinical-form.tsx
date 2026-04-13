"use client";

import { ClinicalMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  UserIcon,
  IdentificationCardIcon,
  MapPinIcon,
  RulerIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

interface ClinicalFormProps {
  metadata: ClinicalMetadata;
  onChange: (metadata: ClinicalMetadata) => void;
}

const FITZPATRICK_OPTIONS = [
  { value: "I", label: "Type I — Pale white" },
  { value: "II", label: "Type II — White, fair" },
  { value: "III", label: "Type III — White to olive" },
  { value: "IV", label: "Type IV — Moderate brown" },
  { value: "V", label: "Type V — Dark brown" },
  { value: "VI", label: "Type VI — Black" },
];

const LOCATION_OPTIONS = [
  "head", "face", "neck", "scalp", "chest", "abdomen", "back",
  "upper arm", "forearm", "hand", "thigh", "lower leg", "foot",
  "shoulder", "ear", "nose",
];

const SYMPTOM_FIELDS: { key: keyof ClinicalMetadata; label: string; id: string }[] = [
  { key: "itch", label: "Itching", id: "symptom-itch" },
  { key: "grew", label: "Recent growth", id: "symptom-grew" },
  { key: "hurt", label: "Pain", id: "symptom-hurt" },
  { key: "changed", label: "Color Change", id: "symptom-changed" },
  { key: "bleed", label: "Bleeding", id: "symptom-bleed" },
  { key: "elevation", label: "Elevated", id: "symptom-elevation" },
];

export function ClinicalForm({ metadata, onChange }: ClinicalFormProps) {
  const update = (field: keyof ClinicalMetadata, value: unknown) => {
    onChange({ ...metadata, [field]: value });
  };

  const labelStyle = "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5 flex items-center gap-2";
  const inputStyle = "w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-sans text-sm outline-none transition-all focus:border-foreground focus:ring-1 focus:ring-foreground/10 placeholder:text-muted-foreground/40";

  return (
    <div className="space-y-8 font-sans" role="form">
      {/* ── Section 1: Demographics ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="field-age" className={labelStyle}>
              <UserIcon size={12} weight="duotone" /> Age
            </label>
            <input
              id="field-age"
              type="number"
              value={metadata.age || ""}
              onChange={(e) => update("age", parseInt(e.target.value) || 0)}
              placeholder="55"
              className={inputStyle}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="field-sex" className={labelStyle}>
              Sex
            </label>
            <select
              id="field-sex"
              value={metadata.sex}
              onChange={(e) => update("sex", e.target.value)}
              className={inputStyle}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label htmlFor="field-fitzpatrick" className={labelStyle}>
            <IdentificationCardIcon size={12} weight="duotone" /> Fitzpatrick Skin Type
          </label>
          <select
            id="field-fitzpatrick"
            value={metadata.fitzpatrick}
            onChange={(e) => update("fitzpatrick", e.target.value)}
            className={inputStyle}
          >
            <option value="">Select Scale</option>
            {FITZPATRICK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Section 2: Lesion Characteristics ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="field-location" className={labelStyle}>
              <MapPinIcon size={12} weight="duotone" /> Location
            </label>
            <select
              id="field-location"
              value={metadata.location}
              onChange={(e) => update("location", e.target.value)}
              className={inputStyle}
            >
              <option value="">Body Part</option>
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc} value={loc} className="capitalize">{loc}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="field-diameter" className={labelStyle}>
              <RulerIcon size={12} weight="duotone" /> Diameter (mm)
            </label>
            <input
              id="field-diameter"
              type="number"
              step={0.1}
              value={metadata.diameter || ""}
              onChange={(e) => update("diameter", parseFloat(e.target.value) || 0)}
              placeholder="6.5"
              className={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Symptoms (Toggle Tiles) ── */}
      <div className="space-y-3">
        <label className={labelStyle}>
          <CheckCircleIcon size={12} weight="duotone" /> Active Symptoms
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SYMPTOM_FIELDS.map(({ key, label, id }) => {
            const isActive = metadata[key] as boolean;
            return (
              <label
                key={key}
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all duration-200",
                  isActive 
                    ? "border-foreground bg-foreground text-background shadow-md" 
                    : "border-border/50 bg-muted/5 text-muted-foreground hover:border-border hover:bg-muted/10"
                )}
              >
                <span className="text-xs font-bold tracking-tight">{label}</span>
                <input
                  id={id}
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => update(key, e.target.checked)}
                  className="sr-only"
                />
                {isActive && <CheckCircleIcon weight="fill" className="size-3.5" />}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}