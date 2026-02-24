#!/usr/bin/env python3
"""Generate a dark-themed pipeline infographic for Confirmd's behind-the-scenes tweet."""

from PIL import Image, ImageDraw, ImageFont
import math

# --- Config ---
W, H = 1200, 1350
BG = (13, 13, 18)           # near-black
CARD_BG = (22, 22, 30)      # dark card
CARD_BORDER = (40, 40, 55)  # subtle border
ACCENT = (99, 102, 241)     # indigo/purple
ACCENT2 = (16, 185, 129)    # emerald green
ACCENT3 = (245, 158, 11)    # amber
ACCENT4 = (239, 68, 68)     # red
WHITE = (255, 255, 255)
GRAY = (156, 163, 175)
LIGHT = (229, 231, 235)
DIM = (107, 114, 128)

# Fonts
def font(size, bold=False):
    idx = 1 if bold else 0
    return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size, index=idx)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# --- Helper functions ---
def rounded_rect(x, y, w, h, r, fill, outline=None):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=r, fill=fill, outline=outline)

def draw_arrow(x1, y1, x2, y2, color=DIM, width=2):
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
    # arrowhead
    angle = math.atan2(y2-y1, x2-x1)
    size = 8
    draw.polygon([
        (x2, y2),
        (x2 - size*math.cos(angle - 0.4), y2 - size*math.sin(angle - 0.4)),
        (x2 - size*math.cos(angle + 0.4), y2 - size*math.sin(angle + 0.4)),
    ], fill=color)

def circle(cx, cy, r, fill):
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill)

def icon_dot(cx, cy, color, size=6):
    circle(cx, cy, size, color)

# --- Header ---
y = 50
# Logo / brand
draw.text((60, y), "CONFIRMD", fill=WHITE, font=font(38, bold=True))
draw.text((310, y+8), "VERIFICATION PIPELINE", fill=DIM, font=font(22))

# Subtle accent line under header
y += 60
draw.line([(60, y), (W-60, y)], fill=(35, 35, 50), width=1)

# --- Subtitle ---
y += 25
draw.text((60, y), "How claims go from raw news to verified verdicts", fill=GRAY, font=font(18))

# --- Pipeline stages ---
y += 55

stages = [
    {
        "title": "1. INGEST",
        "subtitle": "Every 6 hours",
        "color": ACCENT,
        "items": [
            ("14+ RSS feeds", "CoinDesk, The Block, Decrypt, CoinTelegraph..."),
            ("YouTube channels", "Transcripts extracted via yt-dlp"),
            ("On-chain alerts", "Regulatory filings & exchange data"),
        ],
        "stat": "100+ sources",
        "stat_label": "monitored",
    },
    {
        "title": "2. EXTRACT",
        "subtitle": "Claude AI",
        "color": (139, 92, 246),  # violet
        "items": [
            ("Claim detection", "Specific, falsifiable assertions identified"),
            ("Asset tagging", "Symbols, categories, and types classified"),
            ("Confidence scoring", "Falsifiability & strength rated 0-1"),
        ],
        "stat": "18 claim types",
        "stat_label": "classified",
    },
    {
        "title": "3. VERIFY",
        "subtitle": "Evidence grading",
        "color": ACCENT2,
        "items": [
            ("Cross-reference", "Primary sources, on-chain data, filings"),
            ("Evidence grades", "A (strong) through D (weak)"),
            ("Stance analysis", "Supports, contradicts, or irrelevant"),
        ],
        "stat": "A - D",
        "stat_label": "evidence grades",
    },
    {
        "title": "4. VERDICT",
        "subtitle": "Transparent reasoning",
        "color": ACCENT3,
        "items": [
            ("Verdict labels", "Verified · Plausible · Speculative · Misleading"),
            ("Probability score", "Confidence interval for each claim"),
            ("Full reasoning", "Published transparently with every verdict"),
        ],
        "stat": "4 verdict types",
        "stat_label": "with reasoning",
    },
]

card_h = 175
card_w = W - 120
gap = 30

for i, stage in enumerate(stages):
    cy = y + i * (card_h + gap)

    # Card background
    rounded_rect(60, cy, card_w, card_h, 12, CARD_BG, outline=CARD_BORDER)

    # Color accent bar on left
    draw.rounded_rectangle([60, cy, 66, cy+card_h], radius=3, fill=stage["color"])

    # Stage title + subtitle
    draw.text((85, cy + 15), stage["title"], fill=WHITE, font=font(20, bold=True))
    draw.text((85, cy + 42), stage["subtitle"], fill=stage["color"], font=font(14))

    # Items
    for j, (label, desc) in enumerate(stage["items"]):
        ix = 85
        iy = cy + 68 + j * 32
        icon_dot(ix + 5, iy + 8, stage["color"], size=4)
        draw.text((ix + 18, iy), label, fill=LIGHT, font=font(14, bold=True))
        draw.text((ix + 18 + draw.textlength(label, font=font(14, bold=True)) + 10, iy), desc, fill=DIM, font=font(14))

    # Stat badge on right
    stat_w = 130
    stat_x = W - 60 - stat_w - 20
    stat_y = cy + 20
    rounded_rect(stat_x, stat_y, stat_w, 50, 8, (stage["color"][0]//6, stage["color"][1]//6, stage["color"][2]//6))

    # Center stat text
    stat_font = font(18, bold=True)
    tw = draw.textlength(stage["stat"], font=stat_font)
    draw.text((stat_x + (stat_w - tw) / 2, stat_y + 5), stage["stat"], fill=stage["color"], font=stat_font)

    label_font = font(11)
    tw2 = draw.textlength(stage["stat_label"], font=label_font)
    draw.text((stat_x + (stat_w - tw2) / 2, stat_y + 30), stage["stat_label"], fill=DIM, font=label_font)

    # Arrow to next stage
    if i < len(stages) - 1:
        arrow_x = W // 2
        arrow_y1 = cy + card_h + 4
        arrow_y2 = cy + card_h + gap - 4
        draw_arrow(arrow_x, arrow_y1, arrow_x, arrow_y2, color=DIM, width=2)

# --- Creator tracking bar at bottom ---
y_bottom = y + len(stages) * (card_h + gap) + 10
rounded_rect(60, y_bottom, card_w, 80, 12, CARD_BG, outline=CARD_BORDER)

# Red accent
draw.rounded_rectangle([60, y_bottom, 66, y_bottom+80], radius=3, fill=ACCENT4)

draw.text((85, y_bottom + 12), "5. CREATOR TRACKING", fill=WHITE, font=font(20, bold=True))
draw.text((85, y_bottom + 42), "100+ YouTubers tracked", fill=LIGHT, font=font(14))
draw.text((85, y_bottom + 42 + 18), "Accuracy scores recalculated daily  |  Diamond > Gold > Silver > Bronze tiers", fill=DIM, font=font(13))

# Tier badges as colored diamonds (drawn shapes instead of unicode)
tier_colors = [(185, 242, 255), (255, 215, 0), (192, 192, 192), (205, 127, 50)]
bx = W - 60 - 130
for j, col in enumerate(tier_colors):
    cx = bx + j * 28
    cy_d = y_bottom + 38
    s = 8
    draw.polygon([(cx, cy_d - s), (cx + s, cy_d), (cx, cy_d + s), (cx - s, cy_d)], fill=col)

# --- Footer ---
y_footer = y_bottom + 105
draw.line([(60, y_footer), (W-60, y_footer)], fill=(35, 35, 50), width=1)
y_footer += 15

draw.text((60, y_footer), "One person  ·  Zero funding  ·  AI-assisted from day one", fill=GRAY, font=font(16))

# Confirmd branding bottom-right
draw.text((W - 60 - draw.textlength("confirmd.app", font=font(14)), y_footer + 2), "confirmd.app", fill=DIM, font=font(14))

# --- Save ---
output_path = "/Users/lewisjackson/confirmd/pipeline_infographic.png"
img.save(output_path, "PNG", quality=95)
print(f"Saved to {output_path}")
print(f"Size: {W}x{H}")
