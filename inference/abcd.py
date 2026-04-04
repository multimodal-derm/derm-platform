"""
Standalone ABCD feature extraction for inference.

Extracts 14 handcrafted dermatological features from a dermoscopic image:
  - Asymmetry (2): major/minor axis asymmetry scores
  - Border (2): border irregularity and compactness
  - Color (6): mean + std of each HSV channel
  - Diameter (1): from clinical metadata (mm)
  - Texture (3): contrast, homogeneity, energy from GLCM

Total: 14 features matching the model's abcd_proj input.
"""

import numpy as np
from PIL import Image


def extract_abcd_features(image: Image.Image, diameter_mm: float = 0.0) -> np.ndarray:
    """
    Extract 14-dim ABCD features from a dermoscopic image.

    Args:
        image: PIL Image (RGB)
        diameter_mm: lesion diameter from clinical metadata

    Returns:
        np.ndarray of shape (14,)
    """
    img = image.resize((256, 256))
    img_array = np.array(img, dtype=np.float32) / 255.0

    # Convert to grayscale for shape/texture features
    gray = np.mean(img_array, axis=2)

    # Create a simple lesion mask via thresholding
    mask = _create_mask(gray)

    # ── A: Asymmetry (2 features) ──
    asym = _asymmetry_features(mask)

    # ── B: Border (2 features) ──
    border = _border_features(mask)

    # ── C: Color (6 features) ──
    color = _color_features(img_array, mask)

    # ── D: Diameter (1 feature) ──
    diam = np.array([diameter_mm], dtype=np.float32)

    # ── T: Texture (3 features) ──
    texture = _texture_features(gray, mask)

    features = np.concatenate([asym, border, color, diam, texture])
    assert features.shape == (14,), f"Expected 14 features, got {features.shape}"

    return features


def _create_mask(gray: np.ndarray) -> np.ndarray:
    """Simple Otsu-like thresholding for lesion segmentation."""
    threshold = np.mean(gray) - 0.5 * np.std(gray)
    threshold = max(0.1, min(threshold, 0.9))
    mask = (gray < threshold).astype(np.float32)

    # Basic cleanup: keep largest connected region
    if mask.sum() < 100:
        # Fallback: use center region
        h, w = mask.shape
        mask = np.zeros_like(mask)
        mask[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4] = 1.0

    return mask


def _asymmetry_features(mask: np.ndarray) -> np.ndarray:
    """Compute asymmetry along major and minor axes."""
    h, w = mask.shape

    # Horizontal asymmetry
    left = mask[:, : w // 2]
    right = np.fliplr(mask[:, w // 2 : w // 2 * 2])
    if left.shape == right.shape:
        h_asym = np.mean(np.abs(left - right))
    else:
        h_asym = 0.5

    # Vertical asymmetry
    top = mask[: h // 2, :]
    bottom = np.flipud(mask[h // 2 : h // 2 * 2, :])
    if top.shape == bottom.shape:
        v_asym = np.mean(np.abs(top - bottom))
    else:
        v_asym = 0.5

    return np.array([h_asym, v_asym], dtype=np.float32)


def _border_features(mask: np.ndarray) -> np.ndarray:
    """Compute border irregularity and compactness."""
    # Simple edge detection via difference
    edges_h = np.abs(np.diff(mask, axis=0))
    edges_v = np.abs(np.diff(mask, axis=1))
    perimeter = edges_h.sum() + edges_v.sum()
    area = mask.sum()

    if area < 1:
        return np.array([0.0, 0.0], dtype=np.float32)

    # Compactness: 4π * area / perimeter²
    compactness = (4 * np.pi * area) / (perimeter**2 + 1e-6)
    compactness = min(compactness, 1.0)

    # Border irregularity: normalized perimeter
    irregularity = perimeter / (2 * np.sqrt(np.pi * area) + 1e-6)
    irregularity = min(irregularity / 3.0, 1.0)  # Normalize to ~[0, 1]

    return np.array([irregularity, compactness], dtype=np.float32)


def _color_features(img: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Compute color statistics in HSV space within the lesion mask."""
    # Convert RGB to HSV manually
    hsv = _rgb_to_hsv(img)

    # Mask expansion for 3-channel
    mask_3d = mask[:, :, np.newaxis]

    # Masked stats for each HSV channel
    features = []
    for c in range(3):
        channel = hsv[:, :, c]
        masked_vals = channel[mask > 0.5]
        if len(masked_vals) > 10:
            features.append(float(np.mean(masked_vals)))
            features.append(float(np.std(masked_vals)))
        else:
            features.append(0.0)
            features.append(0.0)

    return np.array(features, dtype=np.float32)


def _rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    """Convert RGB [0,1] to HSV [0,1]."""
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    diff = maxc - minc + 1e-10

    # Hue
    h = np.zeros_like(maxc)
    mask_r = maxc == r
    mask_g = maxc == g
    h[mask_r] = ((g[mask_r] - b[mask_r]) / diff[mask_r]) % 6
    h[mask_g] = (b[mask_g] - r[mask_g]) / diff[mask_g] + 2
    h[~mask_r & ~mask_g] = (
        (r[~mask_r & ~mask_g] - g[~mask_r & ~mask_g]) / diff[~mask_r & ~mask_g]
        + 4
    )
    h = h / 6.0

    # Saturation
    s = np.where(maxc > 1e-10, diff / (maxc + 1e-10), 0)

    # Value
    v = maxc

    return np.stack([h, s, v], axis=-1)


def _texture_features(gray: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Compute simple texture features (contrast, homogeneity, energy)."""
    masked = gray * mask
    if mask.sum() < 100:
        return np.array([0.0, 0.0, 0.0], dtype=np.float32)

    # Simplified GLCM-like features via local statistics
    # Use rolling differences as a proxy
    dx = np.diff(masked, axis=1)
    dy = np.diff(masked, axis=0)

    # Contrast: mean squared difference
    # Slice both to same shape since diff reduces different axes
    min_h = min(dx.shape[0], dy.shape[0])
    min_w = min(dx.shape[1], dy.shape[1])
    contrast = float(np.mean(dx[:min_h, :min_w] ** 2 + dy[:min_h, :min_w] ** 2))
    contrast = min(contrast * 10, 1.0)  # Scale to ~[0, 1]

    # Homogeneity: inverse of contrast
    homogeneity = 1.0 / (1.0 + contrast * 10)

    # Energy: sum of squared intensities (normalized)
    vals = gray[mask > 0.5]
    energy = float(np.mean(vals**2))

    return np.array([contrast, homogeneity, energy], dtype=np.float32)