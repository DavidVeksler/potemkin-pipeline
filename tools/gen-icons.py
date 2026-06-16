#!/usr/bin/env python3
"""Generate PWA icons (pure stdlib, no PIL). Draws an amber 'H' on the
brand-dark background — matching the inline SVG favicon in hyperion.html.
Run from repo root: python3 tools/gen-icons.py
Outputs: icon-192.png, icon-512.png, apple-touch-icon.png (180)."""
import struct, zlib, os

BG = (0x0c, 0x0a, 0x08, 0xff)   # brand dark
FG = (0xff, 0x9d, 0x2f, 0xff)   # amber

def draw_H(size, pad_frac):
    """RGBA bytearray for a size×size icon. The H sits inside a centered safe
    zone (pad_frac padding each side) so it survives maskable cropping."""
    px = bytearray()
    n = size
    pad = int(n * pad_frac)
    inner = n - 2 * pad
    # H geometry inside the safe zone
    bar_w = max(2, int(inner * 0.18))      # vertical stroke width
    cross_h = max(2, int(inner * 0.18))    # crossbar height
    left_x0, left_x1 = pad, pad + bar_w
    right_x1, right_x0 = n - pad, n - pad - bar_w
    top_y, bot_y = pad, n - pad
    cy0 = (n - cross_h) // 2
    cy1 = cy0 + cross_h
    for y in range(n):
        px.append(0)  # filter byte: none
        in_v = top_y <= y < bot_y
        in_cross = cy0 <= y < cy1
        for x in range(n):
            on = in_v and ((left_x0 <= x < left_x1) or (right_x0 <= x < right_x1)) \
                 or (in_cross and left_x0 <= x < right_x1)
            px.extend(FG if on else BG)
    return bytes(px)

def write_png(path, size, pad_frac=0.22):
    raw = draw_H(size, pad_frac)
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) \
        + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print(f"wrote {path} ({size}×{size}, {len(png)} bytes)")

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
write_png(os.path.join(root, "icon-192.png"), 192)
write_png(os.path.join(root, "icon-512.png"), 512)
write_png(os.path.join(root, "apple-touch-icon.png"), 180)
