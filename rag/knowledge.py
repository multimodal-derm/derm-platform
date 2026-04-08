"""
Dermatology knowledge base — clinical facts for the 6 PAD-UFES-20 classes.

Each document is a self-contained clinical paragraph that ChromaDB indexes.
At query time the RAG engine retrieves the most relevant chunks and feeds
them to MedGemma as grounding context.
"""

KNOWLEDGE_BASE: list[dict[str, str]] = [
    # ── Actinic Keratosis (ACK) ──────────────────────────────────────────
    {
        "id": "ack-overview",
        "class": "ACK",
        "text": (
            "Actinic keratosis (AK) is a common pre-malignant skin lesion caused by "
            "chronic ultraviolet (UV) radiation exposure. It typically presents as a "
            "rough, scaly patch on sun-exposed areas such as the face, scalp, ears, "
            "forearms, and dorsal hands. AKs are most prevalent in fair-skinned "
            "individuals (Fitzpatrick types I–III) over the age of 40."
        ),
    },
    {
        "id": "ack-progression",
        "class": "ACK",
        "text": (
            "Approximately 5–10% of actinic keratoses may progress to squamous cell "
            "carcinoma (SCC) if left untreated. Risk factors for progression include "
            "lesion thickness, tenderness, rapid growth, and immunosuppression. "
            "The presence of multiple AKs is termed field cancerization and indicates "
            "widespread UV damage to the surrounding skin."
        ),
    },
    {
        "id": "ack-treatment",
        "class": "ACK",
        "text": (
            "Treatment options for actinic keratosis include cryotherapy with liquid "
            "nitrogen, topical 5-fluorouracil (5-FU), imiquimod cream, photodynamic "
            "therapy (PDT), and curettage. For patients with extensive field "
            "cancerization, field-directed therapies such as topical 5-FU or PDT are "
            "preferred over lesion-directed approaches."
        ),
    },
    {
        "id": "ack-dermoscopy",
        "class": "ACK",
        "text": (
            "Dermoscopic features of actinic keratosis include a strawberry pattern "
            "with a pseudo-network of erythema, white-to-yellow scale, and rosette "
            "structures under polarized dermoscopy. Non-pigmented AKs may show a "
            "red pseudo-network, while pigmented variants can display brown dots and "
            "granules that may mimic lentigo maligna."
        ),
    },
    # ── Basal Cell Carcinoma (BCC) ───────────────────────────────────────
    {
        "id": "bcc-overview",
        "class": "BCC",
        "text": (
            "Basal cell carcinoma (BCC) is the most common human malignancy, arising "
            "from the basal layer of the epidermis. It is strongly associated with "
            "cumulative and intermittent UV exposure. BCC typically presents as a "
            "pearly, translucent papule or nodule with telangiectasia, often on the "
            "head and neck. It is locally invasive but rarely metastasizes."
        ),
    },
    {
        "id": "bcc-subtypes",
        "class": "BCC",
        "text": (
            "Major BCC subtypes include nodular (most common, ~60–80%), superficial "
            "(~15–25%), morpheaform/infiltrative (~5–10%), and basosquamous. Nodular "
            "BCC presents as a dome-shaped papule with central ulceration (rodent "
            "ulcer). Superficial BCC appears as a thin, erythematous plaque, often "
            "on the trunk. Morpheaform BCC has ill-defined borders resembling a scar."
        ),
    },
    {
        "id": "bcc-treatment",
        "class": "BCC",
        "text": (
            "Treatment for BCC depends on subtype, size, and location. Options include "
            "surgical excision with margin assessment, Mohs micrographic surgery "
            "(preferred for high-risk or cosmetically sensitive areas), curettage and "
            "electrodesiccation, topical imiquimod or 5-FU (for superficial BCC), "
            "and radiation therapy. Hedgehog pathway inhibitors (vismodegib, "
            "sonidegib) are used for advanced or metastatic BCC."
        ),
    },
    {
        "id": "bcc-dermoscopy",
        "class": "BCC",
        "text": (
            "Dermoscopic hallmarks of BCC include arborizing (tree-like) vessels, "
            "blue-gray ovoid nests, leaf-like areas, spoke-wheel structures, and "
            "ulceration. Superficial BCC may show short fine telangiectasia and "
            "shiny white-red structureless areas. The absence of a pigment network "
            "helps distinguish BCC from melanocytic lesions."
        ),
    },
    # ── Melanoma (MEL) ───────────────────────────────────────────────────
    {
        "id": "mel-overview",
        "class": "MEL",
        "text": (
            "Melanoma is a malignant neoplasm of melanocytes and the most lethal form "
            "of skin cancer. Risk factors include UV exposure, fair skin, multiple "
            "nevi, family history, and CDKN2A/BRAF mutations. The ABCDE rule "
            "(Asymmetry, Border irregularity, Color variation, Diameter >6mm, "
            "Evolution) aids clinical detection. Early-stage melanoma is highly "
            "curable with 5-year survival exceeding 98% for stage I."
        ),
    },
    {
        "id": "mel-subtypes",
        "class": "MEL",
        "text": (
            "Major melanoma subtypes include superficial spreading melanoma (most "
            "common, ~70%), nodular melanoma (~15–30%, most aggressive), lentigo "
            "maligna melanoma (sun-damaged skin in elderly), and acral lentiginous "
            "melanoma (palms, soles, nail beds — more common in darker skin types). "
            "Breslow thickness is the most important prognostic factor."
        ),
    },
    {
        "id": "mel-staging",
        "class": "MEL",
        "text": (
            "Melanoma staging follows the AJCC 8th edition TNM system. Key factors "
            "include Breslow depth, ulceration, mitotic rate, sentinel lymph node "
            "status, and distant metastasis. Sentinel lymph node biopsy is "
            "recommended for melanomas with Breslow depth ≥0.8mm. Advanced melanoma "
            "is treated with checkpoint immunotherapy (pembrolizumab, nivolumab) or "
            "targeted therapy (BRAF/MEK inhibitors for BRAF-mutant tumors)."
        ),
    },
    {
        "id": "mel-dermoscopy",
        "class": "MEL",
        "text": (
            "Dermoscopic features suspicious for melanoma include atypical pigment "
            "network, irregular dots and globules, blue-whitish veil, regression "
            "structures (white scar-like areas, blue-gray peppering), irregular "
            "streaks/pseudopods, and atypical vascular patterns. The 7-point checklist "
            "and ABCD dermoscopy rule are validated scoring systems."
        ),
    },
    # ── Nevus (NEV) ──────────────────────────────────────────────────────
    {
        "id": "nev-overview",
        "class": "NEV",
        "text": (
            "Melanocytic nevi (moles) are benign proliferations of melanocytes. They "
            "are classified as junctional (flat, at dermal-epidermal junction), "
            "compound (slightly raised, both junction and dermis), or intradermal "
            "(dome-shaped, within dermis). Most adults have 10–40 common nevi. "
            "Nevi are significant primarily as mimics of melanoma."
        ),
    },
    {
        "id": "nev-atypical",
        "class": "NEV",
        "text": (
            "Atypical (dysplastic) nevi are larger than common moles (>5mm), with "
            "irregular borders, variable coloration, and sometimes a fried-egg "
            "appearance. While individual dysplastic nevi have low malignant "
            "potential, patients with dysplastic nevus syndrome (>100 nevi, family "
            "history of melanoma) have a markedly increased lifetime melanoma risk "
            "and require regular dermatologic surveillance."
        ),
    },
    {
        "id": "nev-dermoscopy",
        "class": "NEV",
        "text": (
            "Dermoscopic patterns of benign nevi include regular pigment network "
            "(reticular pattern), regular globular pattern, homogeneous blue pattern "
            "(blue nevus), and starburst pattern (Spitz nevus). Symmetry of "
            "structures and colors is the hallmark of benignity. Serial digital "
            "dermoscopy monitoring can detect subtle changes over time."
        ),
    },
    # ── Squamous Cell Carcinoma (SCC) ────────────────────────────────────
    {
        "id": "scc-overview",
        "class": "SCC",
        "text": (
            "Cutaneous squamous cell carcinoma (cSCC) is the second most common skin "
            "cancer, arising from keratinocytes. Risk factors include cumulative UV "
            "exposure, immunosuppression (organ transplant recipients have 65–250x "
            "increased risk), chronic wounds, and HPV infection. SCC typically "
            "presents as a firm, erythematous, keratotic papule or plaque."
        ),
    },
    {
        "id": "scc-risk",
        "class": "SCC",
        "text": (
            "High-risk features for SCC metastasis include tumor diameter >2cm, "
            "depth >6mm or invasion beyond subcutaneous fat, poor differentiation, "
            "perineural invasion, location on the ear or lip, and recurrent tumors. "
            "Metastatic SCC has a poor prognosis with 5-year survival rates of "
            "25–50%. Sentinel lymph node biopsy may be considered for high-risk SCC."
        ),
    },
    {
        "id": "scc-treatment",
        "class": "SCC",
        "text": (
            "Standard treatment for SCC is surgical excision with clear margins. Mohs "
            "surgery is indicated for high-risk SCC, particularly on the head and "
            "neck. Adjuvant radiation may be used for perineural invasion or positive "
            "margins. Cemiplimab (anti-PD-1) is approved for advanced or metastatic "
            "cSCC not amenable to surgery or radiation."
        ),
    },
    {
        "id": "scc-dermoscopy",
        "class": "SCC",
        "text": (
            "Dermoscopic features of SCC include white structureless areas, blood "
            "spots (hemorrhage), keratin/scale, glomerular (coiled) vessels, and "
            "white circles (targetoid hair follicles). Keratoacanthoma-type SCC may "
            "show a central keratin plug with a radial crown of hairpin vessels. "
            "Differentiation from AK relies on the presence of ulceration, "
            "polymorphous vessels, and white circles."
        ),
    },
    # ── Seborrheic Keratosis (SEK) ───────────────────────────────────────
    {
        "id": "sek-overview",
        "class": "SEK",
        "text": (
            "Seborrheic keratosis (SK) is the most common benign epithelial tumor in "
            "adults. SKs present as well-circumscribed, waxy, stuck-on appearing "
            "papules or plaques with a verrucous surface. They range from tan to dark "
            "brown and occur on the trunk, face, and extremities. SKs are not "
            "associated with UV exposure and have no malignant potential."
        ),
    },
    {
        "id": "sek-variants",
        "class": "SEK",
        "text": (
            "Clinical variants of seborrheic keratosis include dermatosis papulosa "
            "nigra (small, darkly pigmented lesions common in individuals with darker "
            "skin), stucco keratoses (gray-white papules on distal extremities), and "
            "irritated SK (inflamed, may show squamous eddies histologically). The "
            "sign of Leser-Trélat — sudden eruption of multiple SKs — may rarely "
            "indicate internal malignancy."
        ),
    },
    {
        "id": "sek-dermoscopy",
        "class": "SEK",
        "text": (
            "Dermoscopic features of seborrheic keratosis include comedo-like openings "
            "(crypts), milia-like cysts, fissures and ridges (gyri and sulci), "
            "moth-eaten borders, hairpin vessels, and a sharply demarcated border. "
            "The brain-like pattern (cerebriform appearance) is characteristic. "
            "Heavily pigmented SK can mimic melanoma but lacks true pigment network."
        ),
    },
    # ── Cross-cutting: ABCD features ─────────────────────────────────────
    {
        "id": "abcd-asymmetry",
        "class": "GENERAL",
        "text": (
            "In the ABCD rule, asymmetry is assessed by dividing the lesion along two "
            "perpendicular axes. A score of 0 indicates symmetry in both axes, 1 is "
            "asymmetric in one axis, and 2 is asymmetric in both. Higher asymmetry "
            "scores correlate with melanoma risk. Benign nevi typically score 0, "
            "while melanomas often score 2."
        ),
    },
    {
        "id": "abcd-border",
        "class": "GENERAL",
        "text": (
            "Border irregularity in the ABCD rule is scored by dividing the lesion into "
            "8 segments and counting segments with abrupt cutoff of pigment at the "
            "periphery. Scores range from 0 to 8. Melanomas typically have score ≥3, "
            "while benign nevi have sharply defined, regular borders scoring 0–2."
        ),
    },
    {
        "id": "abcd-color",
        "class": "GENERAL",
        "text": (
            "Color in the ABCD rule is assessed by counting the number of colors "
            "present: white, red, light brown, dark brown, blue-gray, and black. "
            "Scores range from 1 to 6. Multiple colors (≥3) suggest melanoma, while "
            "benign nevi typically display 1–2 colors. Blue-gray color is particularly "
            "suspicious for melanoma (regression structures)."
        ),
    },
    {
        "id": "abcd-diameter",
        "class": "GENERAL",
        "text": (
            "Diameter in the ABCD rule traditionally uses a cutoff of 6mm. Lesions "
            "larger than 6mm are more concerning for melanoma, though small melanomas "
            "(<6mm) do exist and should not be dismissed. Diameter alone has limited "
            "sensitivity and should be interpreted alongside other features."
        ),
    },
    # ── Cross-cutting: Fitzpatrick and fairness ──────────────────────────
    {
        "id": "fitzpatrick-overview",
        "class": "GENERAL",
        "text": (
            "The Fitzpatrick skin phototype scale classifies skin into six types based "
            "on reaction to UV exposure: Type I (always burns, never tans) through "
            "Type VI (never burns, deeply pigmented). Skin cancer incidence varies "
            "significantly by skin type — SCC and BCC are most common in types I–III, "
            "while acral melanoma is proportionally more common in types V–VI."
        ),
    },
    {
        "id": "fairness-ai",
        "class": "GENERAL",
        "text": (
            "AI dermatology models may exhibit performance disparities across "
            "Fitzpatrick skin types due to training data imbalance. Most public "
            "dermoscopy datasets (including PAD-UFES-20) are skewed toward lighter "
            "skin types. Equitable evaluation requires disaggregated metrics (e.g., "
            "per-type FNR and FPR) and transparency about sample sizes for "
            "underrepresented groups."
        ),
    },
]