import { PredictionResponse, ClinicalMetadata } from "./types";

export interface DemoCase {
  id: string;
  label: string;
  description: string;
  imageUrl: string; // public PAD-UFES-20 sample or placeholder
  metadata: ClinicalMetadata;
  result: PredictionResponse;
  summary: string;
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: "mel-high",
    label: "MEL — High Risk",
    description: "68y male, back, 12mm, growing",
    imageUrl: "/demo/mel.png",
    metadata: {
      age: 68,
      sex: "MALE",
      fitzpatrick: "2",
      location: "BACK",
      diameter: 12,
      itch: false,
      grew: true,
      hurt: false,
      changed: true,
      bleed: true,
      elevation: true,
    },
    result: {
      prediction: "MEL",
      confidence: 0.947,
      risk_level: "HIGH",
      probabilities: {
        MEL: 0.947,
        BCC: 0.031,
        SCC: 0.012,
        ACK: 0.005,
        NEV: 0.003,
        SEK: 0.002,
      },
      abcd_features: {
        asymmetry: [0.82, 0.74],
        border: [0.91, 0.87],
        color: [142, 98, 76, 48, 32, 28],
        diameter: [12.0],
        texture: [0.71, 0.38, 0.62],
      },
      xai: { attention_weights: [[]] },
      clinical_text:
        "Male patient, age 68, presenting with a skin lesion on the back. Fitzpatrick skin type 2. The lesion is elevated. Itching is denied. Bleeding is reported. The lesion has increased in size over time. Recent changes are reported. The patient reports no smoking history.",
      model_version: "demo",
      inference_time_ms: 312,
    },
    summary:
      "The high-confidence melanoma classification warrants urgent dermatological evaluation. The combination of lesion growth, bleeding, and recent change in a 68-year-old male with Fitzpatrick type II skin on the back represents a high-risk profile consistent with melanoma.\n\nThe ABCD analysis reveals significant asymmetry, irregular border, and multicolor variation — hallmarks of malignant transformation. The 12mm diameter exceeds the classic 6mm threshold used in clinical screening.\n\nImmediate recommended action is excisional biopsy with 1–2mm clinical margins for histopathological confirmation and Breslow depth measurement. Sentinel lymph node biopsy should be considered if depth exceeds 0.8mm.\n\nThis is an AI-generated summary and should not be considered a diagnosis. Specialist review is essential.",
  },
  {
    id: "bcc-moderate",
    label: "BCC — Moderate Risk",
    description: "55y female, nose, 6mm, itching",
    imageUrl: "/demo/bcc.png",
    metadata: {
      age: 55,
      sex: "FEMALE",
      fitzpatrick: "2",
      location: "NOSE",
      diameter: 6,
      itch: true,
      grew: true,
      hurt: false,
      changed: true,
      bleed: false,
      elevation: true,
    },
    result: {
      prediction: "BCC",
      confidence: 0.751,
      risk_level: "MODERATE",
      probabilities: {
        BCC: 0.751,
        SCC: 0.142,
        ACK: 0.062,
        MEL: 0.024,
        SEK: 0.012,
        NEV: 0.009,
      },
      abcd_features: {
        asymmetry: [0.44, 0.38],
        border: [0.72, 0.68],
        color: [198, 156, 132, 28, 22, 18],
        diameter: [6.0],
        texture: [0.48, 0.52, 0.41],
      },
      xai: { attention_weights: [[]] },
      clinical_text:
        "Female patient, age 55, presenting with a skin lesion on the nose. Fitzpatrick skin type 2. The lesion is elevated. Itching is reported. No bleeding. The lesion has increased in size. Recent changes noted.",
      model_version: "demo",
      inference_time_ms: 298,
    },
    summary:
      "The predicted basal cell carcinoma on the nasal region requires timely clinical evaluation. BCC is the most common skin cancer and rarely metastasizes, but can cause significant local tissue destruction particularly in this perinasal location.\n\nThe moderate border irregularity and slow growth pattern are consistent with the nodular BCC subtype, the most common variant. Fitzpatrick type II skin with presumed UV exposure history is a classic risk factor.\n\nRecommended next steps include dermoscopic examination for arborizing vessels and blue-grey ovoid nests, followed by shave or punch biopsy for histological subtyping. Treatment options range from surgical excision to Mohs micrographic surgery given the location.\n\nThis is an AI-generated summary and should not be considered a diagnosis.",
  },
  {
    id: "sek-low",
    label: "SEK — Low Risk",
    description: "60y male, face, 8mm, elevated",
    imageUrl: "/demo/sek.png",
    metadata: {
      age: 60,
      sex: "MALE",
      fitzpatrick: "3",
      location: "FACE",
      diameter: 8,
      itch: false,
      grew: false,
      hurt: false,
      changed: false,
      bleed: false,
      elevation: true,
    },
    result: {
      prediction: "SEK",
      confidence: 0.936,
      risk_level: "LOW",
      probabilities: {
        SEK: 0.936,
        NEV: 0.032,
        BCC: 0.018,
        ACK: 0.008,
        MEL: 0.004,
        SCC: 0.002,
      },
      abcd_features: {
        asymmetry: [0.18, 0.22],
        border: [0.31, 0.28],
        color: [168, 128, 98, 22, 18, 14],
        diameter: [8.0],
        texture: [0.28, 0.64, 0.32],
      },
      xai: { attention_weights: [[]] },
      clinical_text:
        "Male patient, age 60, presenting with a skin lesion on the face. Fitzpatrick skin type 3. The lesion is elevated. No itching, bleeding, or growth reported.",
      model_version: "demo",
      inference_time_ms: 287,
    },
    summary:
      "The high-confidence seborrheic keratosis classification is reassuring. SEK is a benign epidermal growth with no malignant potential. The stuck-on waxy appearance and well-defined border are characteristic dermoscopic features.\n\nThe low asymmetry and homogeneous color distribution in the ABCD analysis are consistent with a benign process. No intervention is medically necessary unless the lesion causes cosmetic concern or becomes irritated.\n\nMonitoring is recommended if the lesion changes in appearance, bleeds spontaneously, or causes symptoms. The Leser-Trélat sign (sudden eruption of multiple SEKs) should be excluded in older patients as it can rarely indicate internal malignancy.\n\nThis is an AI-generated summary and should not be considered a diagnosis.",
  },
  {
    id: "ack-moderate",
    label: "ACK — Moderate Risk",
    description: "72y female, arm, 5mm, scaling",
    imageUrl: "/demo/ack.png",
    metadata: {
      age: 72,
      sex: "FEMALE",
      fitzpatrick: "1",
      location: "ARM",
      diameter: 5,
      itch: true,
      grew: false,
      hurt: true,
      changed: false,
      bleed: false,
      elevation: false,
    },
    result: {
      prediction: "ACK",
      confidence: 0.788,
      risk_level: "MODERATE",
      probabilities: {
        ACK: 0.788,
        SCC: 0.142,
        BCC: 0.038,
        SEK: 0.018,
        MEL: 0.009,
        NEV: 0.005,
      },
      abcd_features: {
        asymmetry: [0.31, 0.28],
        border: [0.58, 0.52],
        color: [212, 178, 154, 32, 26, 22],
        diameter: [5.0],
        texture: [0.54, 0.46, 0.48],
      },
      xai: { attention_weights: [[]] },
      clinical_text:
        "Female patient, age 72, presenting with a skin lesion on the arm. Fitzpatrick skin type 1. The lesion is not elevated. Itching and pain are reported. No growth or bleeding.",
      model_version: "demo",
      inference_time_ms: 301,
    },
    summary:
      "Actinic keratosis is a pre-malignant lesion with estimated 0.1–10% annual risk of progression to squamous cell carcinoma. The differential with SCC at 14.2% probability warrants clinical attention.\n\nFitzpatrick type I skin with chronic UV exposure is the primary risk factor. The symptomatic nature (itch and pain) suggests an active lesion. Field cancerization should be evaluated — multiple ACKs in the same anatomical region indicate widespread UV damage.\n\nTreatment options include cryotherapy, topical 5-fluorouracil, imiquimod cream, photodynamic therapy, or ingenol mebutate gel. Biopsy should be considered if the lesion is hypertrophic, indurated, or fails to respond to treatment to exclude SCC.\n\nThis is an AI-generated summary and should not be considered a diagnosis.",
  },
];
