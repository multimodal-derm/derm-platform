"use client";

import { ClinicalMetadata } from "@/lib/types";

interface ClinicalFormProps {
  metadata: ClinicalMetadata;
  onChange: (metadata: ClinicalMetadata) => void;
}

const FITZPATRICK_OPTIONS = [
  { value: "I", label: "Type I — Light, pale white" },
  { value: "II", label: "Type II — White, fair" },
  { value: "III", label: "Type III — Medium, white to olive" },
  { value: "IV", label: "Type IV — Olive, moderate brown" },
  { value: "V", label: "Type V — Brown, dark brown" },
  { value: "VI", label: "Type VI — Very dark brown to black" },
];

const LOCATION_OPTIONS = [
  "head", "face", "neck", "scalp",
  "chest", "abdomen", "back",
  "upper arm", "forearm", "hand",
  "thigh", "lower leg", "foot",
  "shoulder", "ear", "nose",
];

const SYMPTOM_FIELDS: { key: keyof ClinicalMetadata; label: string; id: string }[] = [
  { key: "itch", label: "Itching", id: "symptom-itch" },
  { key: "grew", label: "Recent growth", id: "symptom-grew" },
  { key: "hurt", label: "Pain", id: "symptom-hurt" },
  { key: "changed", label: "Color/shape change", id: "symptom-changed" },
  { key: "bleed", label: "Bleeding", id: "symptom-bleed" },
  { key: "elevation", label: "Elevated", id: "symptom-elevation" },
];

export function ClinicalForm({ metadata, onChange }: ClinicalFormProps) {
  const update = (field: keyof ClinicalMetadata, value: unknown) => {
    onChange({ ...metadata, [field]: value });
  };

  return (
    <div className="space-y-5" role="form" aria-label="Clinical metadata form">
      {/* Demographics */}
      <fieldset>
        <legend className="text-xs font-semibold text-clinical-muted uppercase tracking-wider mb-3">
          Patient Demographics
          <span className="sr-only"> (all fields required)</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="field-age" className="clinical-label">
              Age <span className="text-risk-high" aria-hidden="true">*</span>
            </label>
            <input
              id="field-age"
              type="number"
              min={0}
              max={120}
              value={metadata.age || ""}
              onChange={(e) => update("age", parseInt(e.target.value) || 0)}
              placeholder="e.g. 55"
              aria-required="true"
              className="clinical-input"
            />
          </div>
          <div>
            <label htmlFor="field-sex" className="clinical-label">
              Sex <span className="text-risk-high" aria-hidden="true">*</span>
            </label>
            <select
              id="field-sex"
              value={metadata.sex}
              onChange={(e) => update("sex", e.target.value)}
              aria-required="true"
              className="clinical-select"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Fitzpatrick */}
      <div>
        <label htmlFor="field-fitzpatrick" className="clinical-label">
          Fitzpatrick Skin Type <span className="text-risk-high" aria-hidden="true">*</span>
        </label>
        <select
          id="field-fitzpatrick"
          value={metadata.fitzpatrick}
          onChange={(e) => update("fitzpatrick", e.target.value)}
          aria-required="true"
          className="clinical-select"
        >
          <option value="">Select skin type</option>
          {FITZPATRICK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lesion Info */}
      <fieldset>
        <legend className="text-xs font-semibold text-clinical-muted uppercase tracking-wider mb-3">
          Lesion Characteristics
          <span className="sr-only"> (all fields required)</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="field-location" className="clinical-label">
              Location <span className="text-risk-high" aria-hidden="true">*</span>
            </label>
            <select
              id="field-location"
              value={metadata.location}
              onChange={(e) => update("location", e.target.value)}
              aria-required="true"
              className="clinical-select"
            >
              <option value="">Select</option>
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc.charAt(0).toUpperCase() + loc.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="field-diameter" className="clinical-label">
              Diameter (mm) <span className="text-risk-high" aria-hidden="true">*</span>
            </label>
            <input
              id="field-diameter"
              type="number"
              min={0}
              step={0.1}
              value={metadata.diameter || ""}
              onChange={(e) =>
                update("diameter", parseFloat(e.target.value) || 0)
              }
              placeholder="e.g. 6.5"
              aria-required="true"
              className="clinical-input"
            />
          </div>
        </div>
      </fieldset>

      {/* Symptoms */}
      <fieldset>
        <legend className="text-xs font-semibold text-clinical-muted uppercase tracking-wider mb-3">
          Symptoms
          <span className="sr-only"> (optional, check all that apply)</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {SYMPTOM_FIELDS.map(({ key, label, id }) => (
            <label
              key={key}
              htmlFor={id}
              className="flex items-center gap-2.5 rounded-lg border border-clinical-border px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                id={id}
                type="checkbox"
                checked={metadata[key] as boolean}
                onChange={(e) => update(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-clinical-text">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Required fields note */}
      <p className="text-xs text-clinical-muted" aria-hidden="true">
        <span className="text-risk-high">*</span> Required fields
      </p>
    </div>
  );
}
