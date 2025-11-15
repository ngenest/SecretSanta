from __future__ import annotations

from pathlib import Path
from typing import Iterable, List

WIDTH = 192
HEIGHT = 192

# Palette indices
BG_GRADIENT = [0, 1, 2, 3, 15]
LEFT_BASE = 4
LEFT_BASE_DARK = 5
RIGHT_BASE = 6
RIGHT_BASE_DARK = 7
RIBBON_LIGHT = 10
RIBBON_GOLD = 11
BOW_LEFT = 4
BOW_RIGHT = 6
BOW_LEFT_HIGHLIGHT = 16
BOW_RIGHT_HIGHLIGHT = 17
GLOW = 13
HIGHLIGHT = 12
BACKGROUND_GLOW = 14

PALETTE: List[tuple[int, int, int]] = [
    (12, 16, 40),  # 0 deepest blue
    (18, 22, 52),  # 1
    (24, 30, 66),  # 2
    (32, 38, 80),  # 3
    (239, 71, 111),  # 4 rich red
    (191, 36, 88),  # 5 darker red
    (45, 140, 255),  # 6 vibrant blue
    (32, 94, 210),  # 7 deeper blue
    (31, 200, 139),  # 8 emerald
    (22, 132, 92),  # 9 deep emerald
    (255, 209, 102),  # 10 bright gold
    (244, 174, 60),  # 11 rich gold
    (255, 248, 224),  # 12 warm highlight
    (120, 64, 200),  # 13 magenta glow
    (28, 26, 68),  # 14 soft vignette
    (16, 20, 48),  # 15 extra dark
    (255, 134, 160),  # 16 bow highlight left
    (120, 200, 255),  # 17 bow highlight right
    (90, 34, 180),  # 18 purple accent
    (20, 28, 60),  # 19 filler to reach power of two
]

# pad palette to power of two length (32 entries)
while len(PALETTE) < 32:
    PALETTE.append(PALETTE[-1])


def make_background() -> list[int]:
    data = [0] * (WIDTH * HEIGHT)
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        idx = BG_GRADIENT[min(int(t * (len(BG_GRADIENT) - 1)), len(BG_GRADIENT) - 1)]
        row_offset = y * WIDTH
        for x in range(WIDTH):
            data[row_offset + x] = idx
    return data


def ellipse_contains(x: int, y: int, cx: float, cy: float, rx: float, ry: float) -> bool:
    nx = (x - cx) / rx
    ny = (y - cy) / ry
    return nx * nx + ny * ny <= 1.0


def add_rect(data: list[int], left: int, top: int, right: int, bottom: int, color: int) -> None:
    left = max(0, left)
    right = min(WIDTH, right)
    top = max(0, top)
    bottom = min(HEIGHT, bottom)
    for y in range(top, bottom):
        row_offset = y * WIDTH
        for x in range(left, right):
            data[row_offset + x] = color


def add_rect_gradient(data: list[int], left: int, top: int, right: int, bottom: int, color_a: int, color_b: int, horizontal: bool) -> None:
    left = max(0, left)
    right = min(WIDTH, right)
    top = max(0, top)
    bottom = min(HEIGHT, bottom)
    if horizontal:
        span = max(1, right - left - 1)
        for y in range(top, bottom):
            row_offset = y * WIDTH
            for x in range(left, right):
                t = (x - left) / span
                data[row_offset + x] = color_a if t < 0.5 else color_b
    else:
        span = max(1, bottom - top - 1)
        for y in range(top, bottom):
            t = (y - top) / span
            row_offset = y * WIDTH
            color = color_a if t < 0.5 else color_b
            for x in range(left, right):
                data[row_offset + x] = color


def add_bow(data: list[int]) -> None:
    cx = WIDTH / 2
    top = int(HEIGHT * 0.26)
    rx = WIDTH * 0.23
    ry = HEIGHT * 0.17
    for y in range(int(top - ry * 1.1), int(top + ry * 1.1)):
        if y < 0 or y >= HEIGHT:
            continue
        row_offset = y * WIDTH
        for x in range(int(cx - rx * 1.3), int(cx + rx * 1.3)):
            if x < 0 or x >= WIDTH:
                continue
            if ellipse_contains(x, y, cx - rx * 0.55, top, rx, ry):
                data[row_offset + x] = BOW_LEFT
            if ellipse_contains(x, y, cx + rx * 0.55, top, rx, ry):
                data[row_offset + x] = BOW_RIGHT

    # highlights
    for y in range(int(top - ry), int(top + ry * 0.8)):
        if y < 0 or y >= HEIGHT:
            continue
        row_offset = y * WIDTH
        for x in range(int(cx - rx), int(cx)):
            if ellipse_contains(x, y, cx - rx * 0.55, top, rx * 0.8, ry * 0.8):
                data[row_offset + x] = BOW_LEFT_HIGHLIGHT
        for x in range(int(cx), int(cx + rx)):
            if ellipse_contains(x, y, cx + rx * 0.55, top, rx * 0.8, ry * 0.8):
                data[row_offset + x] = BOW_RIGHT_HIGHLIGHT


def add_glow(data: list[int]) -> None:
    cx = WIDTH / 2
    cy = HEIGHT * 0.5
    rx = WIDTH * 0.46
    ry = HEIGHT * 0.38
    for y in range(int(cy - ry), int(cy + ry)):
        if y < 0 or y >= HEIGHT:
            continue
        row_offset = y * WIDTH
        for x in range(int(cx - rx), int(cx + rx)):
            if x < 0 or x >= WIDTH:
                continue
            if ellipse_contains(x, y, cx, cy, rx, ry):
                existing = data[row_offset + x]
                if existing in BG_GRADIENT:
                    data[row_offset + x] = BACKGROUND_GLOW


def add_highlight(data: list[int]) -> None:
    cx = WIDTH / 2
    cy = HEIGHT * 0.72
    rx = WIDTH * 0.26
    ry = HEIGHT * 0.12
    for y in range(int(cy - ry), int(cy + ry)):
        if y < 0 or y >= HEIGHT:
            continue
        row_offset = y * WIDTH
        for x in range(int(cx - rx), int(cx + rx)):
            if x < 0 or x >= WIDTH:
                continue
            if ellipse_contains(x, y, cx, cy, rx, ry):
                data[row_offset + x] = HIGHLIGHT


def add_box(data: list[int]) -> None:
    left = int(WIDTH * 0.2)
    right = int(WIDTH * 0.8)
    top = int(HEIGHT * 0.38)
    bottom = int(HEIGHT * 0.78)
    mid = (left + right) // 2

    add_rect_gradient(data, left, top, mid, bottom, LEFT_BASE, LEFT_BASE_DARK, horizontal=True)
    add_rect_gradient(data, mid, top, right, bottom, RIGHT_BASE, RIGHT_BASE_DARK, horizontal=True)

    # lid
    lid_top = int(HEIGHT * 0.32)
    lid_bottom = int(HEIGHT * 0.38)
    add_rect_gradient(data, left - 6, lid_top, right + 6, lid_bottom, RIGHT_BASE, LEFT_BASE, horizontal=True)

    # ribbon horizontal
    ribbon_top = int(top + (bottom - top) * 0.48)
    ribbon_bottom = ribbon_top + int(HEIGHT * 0.05)
    add_rect_gradient(data, left, ribbon_top, right, ribbon_bottom, RIBBON_LIGHT, RIBBON_GOLD, horizontal=False)

    # vertical ribbon
    ribbon_mid = int((left + right) / 2)
    ribbon_half = int(WIDTH * 0.06)
    add_rect_gradient(
        data,
        ribbon_mid - ribbon_half,
        lid_top,
        ribbon_mid + ribbon_half,
        bottom + int(HEIGHT * 0.02),
        RIBBON_LIGHT,
        RIBBON_GOLD,
        horizontal=False,
    )


def apply_shimmer(data: list[int], phase: float) -> None:
    shift = phase * WIDTH * 2
    thickness = 6
    for y in range(HEIGHT):
        row_offset = y * WIDTH
        for x in range(WIDTH):
            if data[row_offset + x] in (LEFT_BASE, LEFT_BASE_DARK, RIGHT_BASE, RIGHT_BASE_DARK, RIBBON_LIGHT, RIBBON_GOLD):
                value = x + y * 1.2
                if abs((value + shift) % (WIDTH / 1.5) - (WIDTH / 3)) < thickness:
                    data[row_offset + x] = HIGHLIGHT


def make_frame(phase: float) -> list[int]:
    frame = make_background()
    add_glow(frame)
    add_box(frame)
    add_bow(frame)
    add_highlight(frame)
    apply_shimmer(frame, phase)
    return frame


def lzw_compress(indices: Iterable[int], min_code_size: int) -> bytes:
    clear_code = 1 << min_code_size
    end_code = clear_code + 1
    dictionary = {bytes([i]): i for i in range(clear_code)}
    dict_size = end_code + 1

    codes: List[int] = [clear_code]
    w = b''
    for index in indices:
        k = bytes([index])
        wk = w + k
        if wk in dictionary:
            w = wk
        else:
            if w:
                codes.append(dictionary[w])
            dictionary[wk] = dict_size
            dict_size += 1
            w = k
            if dict_size >= 4096:
                codes.append(clear_code)
                dictionary = {bytes([i]): i for i in range(clear_code)}
                dict_size = end_code + 1
                w = b''
    if w:
        codes.append(dictionary[w])
    codes.append(end_code)

    # pack codes into bytes
    code_size = min_code_size + 1
    max_code = (1 << code_size) - 1
    output = bytearray()
    current = 0
    bits = 0

    for code in codes:
        current |= code << bits
        bits += code_size
        while bits >= 8:
            output.append(current & 0xFF)
            current >>= 8
            bits -= 8
        if dict_size > max_code and code_size < 12:
            code_size += 1
            max_code = (1 << code_size) - 1
    if bits:
        output.append(current & 0xFF)
    return bytes(output)


def write_sub_blocks(data: bytes) -> bytes:
    chunks = bytearray()
    for i in range(0, len(data), 255):
        chunk = data[i : i + 255]
        chunks.append(len(chunk))
        chunks.extend(chunk)
    chunks.append(0)
    return bytes(chunks)


def build_gif(frames: list[list[int]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('wb') as fh:
        fh.write(b'GIF89a')
        fh.write(WIDTH.to_bytes(2, 'little'))
        fh.write(HEIGHT.to_bytes(2, 'little'))
        # global color table flag (1), color resolution (111), sort flag (0), size (101 -> 32 colors)
        packed = 0b11100111
        fh.write(bytes([packed]))
        fh.write(b'\x00')  # background color index
        fh.write(b'\x00')  # pixel aspect ratio

        # color table
        for r, g, b in PALETTE:
            fh.write(bytes([r, g, b]))

        for frame_index, pixels in enumerate(frames):
            # Graphics Control Extension
            fh.write(b'\x21\xF9\x04')
            fh.write(b'\x08')  # no transparency, dispose to background
            fh.write((10).to_bytes(2, 'little'))  # delay (10 * 1/100s)
            fh.write(b'\x00')  # transparent color index
            fh.write(b'\x00')

            # Image Descriptor
            fh.write(b'\x2C')
            fh.write((0).to_bytes(2, 'little'))
            fh.write((0).to_bytes(2, 'little'))
            fh.write(WIDTH.to_bytes(2, 'little'))
            fh.write(HEIGHT.to_bytes(2, 'little'))
            fh.write(b'\x00')  # no local color table

            min_code_size = 8
            compressed = lzw_compress(pixels, min_code_size)
            fh.write(bytes([min_code_size]))
            fh.write(write_sub_blocks(compressed))

        fh.write(b'\x3B')  # terminator


OUTPUT_PATHS = [
    Path('frontend/public/assets/secret-santa-logo-animated.gif'),
    Path('backend/src/assets/secret-santa-logo-animated.gif'),
]


def main() -> None:
    frames = [make_frame(i / 12.0) for i in range(12)]
    for output_path in OUTPUT_PATHS:
        build_gif(frames, output_path)
        print(f'Generated {output_path}')


if __name__ == '__main__':
    main()
