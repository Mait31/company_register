from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_IMAGE = ROOT / "frontend" / "src" / "assets" / "central-asia-hero.webp"
OUTPUT_IMAGE = ROOT / "frontend" / "public" / "social-preview.png"
WIDTH = 1200
HEIGHT = 630


def font(size: int, bold: bool = False, serif: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/NotoSerifSC-VF.ttf") if serif else None,
        Path("C:/Windows/Fonts/NotoSansSC-VF.ttf"),
        Path("C:/Windows/Fonts/msyhbd.ttc") if bold else Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
    ]
    for candidate in candidates:
        if candidate and candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    left = (resized.width - target_w) // 2
    top = max(0, (resized.height - target_h) // 2 - 10)
    return resized.crop((left, top, left + target_w, top + target_h))


def draw_gradient_overlay(base: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    pixels = overlay.load()
    for x in range(WIDTH):
        ratio = x / WIDTH
        alpha = round(192 * (1 - ratio) + 36 * ratio)
        for y in range(HEIGHT):
            vertical = 30 if y > HEIGHT * 0.58 else 0
            pixels[x, y] = (4, 43, 55, min(225, alpha + vertical))
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def rounded_rectangle(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_logo(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    draw.ellipse((x, y, x + 78, y + 78), fill="#075f6b", outline=(255, 255, 255, 130), width=2)
    mountain = [(x + 16, y + 52), (x + 33, y + 24), (x + 45, y + 44), (x + 55, y + 30), (x + 66, y + 52)]
    draw.line(mountain, fill="#ffffff", width=4, joint="curve")
    draw.line((x + 35, y + 25, x + 40, y + 53), fill="#ffffff", width=3)
    draw.line((x + 55, y + 31, x + 49, y + 53), fill="#ffffff", width=3)


def main() -> None:
    hero = Image.open(SOURCE_IMAGE).convert("RGB")
    hero = cover(hero, (WIDTH, HEIGHT))
    hero = ImageEnhance.Color(hero).enhance(1.08)
    hero = ImageEnhance.Contrast(hero).enhance(1.04)
    canvas = draw_gradient_overlay(hero)
    draw = ImageDraw.Draw(canvas)

    title_font = font(70, bold=True, serif=True)
    subtitle_font = font(34, bold=True)
    body_font = font(28)
    small_font = font(24)
    tag_font = font(22, bold=True)

    draw_logo(draw, 78, 72)
    draw.text((176, 84), "吉速通出入境服务", fill="#ffffff", font=subtitle_font)
    draw.text((178, 128), "官方网站 · 中文服务", fill=(220, 238, 240, 238), font=small_font)

    title_y = 216
    draw.text((78, title_y), "吉尔吉斯斯坦、塔吉克斯坦", fill="#ffffff", font=title_font)
    draw.text((78, title_y + 84), "签证与商务落地服务", fill="#ffffff", font=title_font)

    draw.text((82, 420), "公司办理 · 财税咨询 · 本地资源协助", fill=(244, 249, 250, 244), font=body_font)

    rounded_rectangle(draw, (80, 488, 248, 540), 26, "#d49a35")
    draw.text((108, 501), "jsutong.cn", fill="#ffffff", font=tag_font)

    rounded_rectangle(draw, (278, 488, 642, 540), 26, "#0b6f78")
    draw.text((308, 501), "面向中国客户的中亚服务入口", fill="#ffffff", font=tag_font)

    draw.text((880, 528), "KYRGYZSTAN  ·  TAJIKISTAN", fill=(255, 255, 255, 215), font=small_font)

    OUTPUT_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUTPUT_IMAGE, "PNG", optimize=True)
    print(f"Wrote {OUTPUT_IMAGE} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
