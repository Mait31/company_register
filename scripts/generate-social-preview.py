from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_IMAGE = ROOT / "docs" / "design" / "social-preview-source.png"
OUTPUT_IMAGE = ROOT / "frontend" / "public" / "social-preview.png"
TARGET_SIZE = (1200, 630)


def main() -> None:
    if not SOURCE_IMAGE.exists():
        raise FileNotFoundError(f"Missing source image: {SOURCE_IMAGE}")

    image = Image.open(SOURCE_IMAGE).convert("RGB")
    preview = ImageOps.fit(image, TARGET_SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))

    OUTPUT_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    preview.save(OUTPUT_IMAGE, "PNG", optimize=True)
    print(f"Wrote {OUTPUT_IMAGE} ({TARGET_SIZE[0]}x{TARGET_SIZE[1]}) from {SOURCE_IMAGE}")


if __name__ == "__main__":
    main()
