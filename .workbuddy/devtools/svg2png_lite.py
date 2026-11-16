#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
svg2png_lite.py —— 极简 SVG 路径光栅化器（纯 Pillow，零原生依赖）

存在原因：本机 cairosvg / svglib+reportlab 都缺原生 cairo 库（rlPyCairo 不可用），
而 game-icon-pack 的图标恰好是**单路径扁平 currentColor** 图标（viewBox 0 0 10 10），
路径命令只用到 M/L/H/V/C/Q/A/Z —— 足够手写一个可靠的光栅化器。

支持：
  · 路径命令 M L H V C S Q T A Z（绝对+相对）
  · 椭圆弧 A：用端点→中心参数化换算成贝塞尔
  · 三次/二次贝塞尔：自适应细分展平为折线
  · 非零环绕填充（fill-rule 默认 nonzero）+ 抗锯齿（4× 超采样后缩放）
  · currentColor → 指定 RGBA 颜色

用法：
  python svg2png_lite.py <in.svg> <out.png> <size> [r,g,b,a]
"""
import re
import sys
import math
from PIL import Image, ImageDraw


# ---------- 路径解析 ----------
TOKEN = re.compile(r'([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)')


def parse_path(d):
    """把 SVG path d 属性解析成 [(cmd, [params...]), ...]

    🔴 关键：路径里**同一个命令可重复出现**（如 "M0 0 L1 1 2 2 3 3" 里的两个 L 组）。
       正确做法 = 按命令分组贪心吃参数，参数用完就接着解析下一个命令。
    """
    toks = [(m.group(1), float(m.group(2))) if m.group(1) is None else (m.group(1), None)
            for m in TOKEN.finditer(d)]
    out = []
    i = 0
    cur_cmd = None
    while i < len(toks):
        cmd, num = toks[i]
        if cmd is not None:
            cur_cmd = cmd
            i += 1
        if cur_cmd is None:
            i += 1
            continue
        need = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'S': 4, 'Q': 4, 'T': 2, 'A': 7, 'Z': 0}[cur_cmd.upper()]
        params = []
        while len(params) < need and i < len(toks) and toks[i][0] is None:
            params.append(toks[i][1])
            i += 1
        if len(params) < need:
            break
        out.append((cur_cmd, params))
        # Z 之后若紧跟数字（无新命令），按规范视为无效 → 跳出
        if cur_cmd.upper() == 'Z':
            cur_cmd = None
    return out


def bezier3(p0, p1, p2, p3, steps=24):
    pts = []
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
        y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
        pts.append((x, y))
    return pts


def bezier2(p0, p1, p2, steps=20):
    pts = []
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        x = u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0]
        y = u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]
        pts.append((x, y))
    return pts


def arc_to_beziers(p0, rx, ry, rot_deg, large_arc, sweep, p1):
    """SVG 椭圆弧（端点参数化）→ 三次贝塞尔序列。返回 [p1,c1,c2,...,pEnd]。"""
    if rx == 0 or ry == 0:
        return [p1]
    phi = math.radians(rot_deg)
    cp, sp = math.cos(phi), math.sin(phi)
    dx2, dy2 = (p0[0] - p1[0]) / 2.0, (p0[1] - p1[1]) / 2.0
    x1 = cp * dx2 + sp * dy2
    y1 = -sp * dx2 + cp * dy2
    rx, ry = abs(rx), abs(ry)
    lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
    if lam > 1:
        s = math.sqrt(lam)
        rx, ry = rx * s, ry * s
    num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
    den = rx * rx * y1 * y1 + ry * ry * x1 * x1
    co = math.sqrt(max(0.0, num / den)) if den else 0.0
    if large_arc == sweep:
        co = -co
    cx1 = co * rx * y1 / ry
    cy1 = -co * ry * x1 / rx
    cx = cp * cx1 - sp * cy1 + (p0[0] + p1[0]) / 2.0
    cy = sp * cx1 + cp * cy1 + (p0[1] + p1[1]) / 2.0

    def ang(ux, uy, vx, vy):
        dot = ux * vx + uy * vy
        n = math.hypot(ux, uy) * math.hypot(vx, vy)
        a = math.acos(max(-1.0, min(1.0, dot / n))) if n else 0.0
        return -a if ux * vy - uy * vx < 0 else a

    th1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
    dth = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
    if not sweep and dth > 0:
        dth -= 2 * math.pi
    elif sweep and dth < 0:
        dth += 2 * math.pi

    segs = max(1, int(math.ceil(abs(dth) / (math.pi / 2))))
    delta = dth / segs
    t = 4.0 / 3.0 * math.tan(delta / 4.0)
    out = []
    th = th1
    for _ in range(segs):
        cos1, sin1 = math.cos(th), math.sin(th)
        th2 = th + delta
        cos2, sin2 = math.cos(th2), math.sin(th2)

        def pt(c, s):
            return (cp * rx * c - sp * ry * s + cx, sp * rx * c + cp * ry * s + cy)

        def dv(c, s):
            return (-rx * s, ry * c)

        p_start, p_end = pt(cos1, sin1), pt(cos2, sin2)
        d1 = dv(cos1, sin1)
        d2 = dv(cos2, sin2)
        c1 = (p_start[0] + t * d1[0], p_start[1] + t * d1[1])
        c2 = (p_end[0] - t * d2[0], p_end[1] - t * d2[1])
        out.extend([c1, c2, p_end])
        th = th2
    return out


def path_to_polys(cmds, scale, ox, oy):
    """路径 → 折线子路径列表（已乘 scale 并平移）。"""
    polys, cur = [], []
    x = y = 0.0
    sx = sy = 0.0
    prev_c2 = None   # 上一次 C 的第二控制点（S 用）
    prev_q = None    # 上一次 Q 的控制点（T 用）
    i = 0
    while i < len(cmds):
        cmd, p = cmds[i]
        i += 1
        rel = cmd.islower()
        c = cmd.upper()
        if c == 'M':
            nx, ny = (x + p[0], y + p[1]) if rel else (p[0], p[1])
            if cur:
                polys.append(cur)
            x, y = nx, ny
            sx, sy = x, y
            cur = [(x, y)]
            prev_c2 = prev_q = None
        elif c == 'L':
            nx, ny = (x + p[0], y + p[1]) if rel else (p[0], p[1])
            cur.append((nx, ny))
            x, y = nx, ny
            prev_c2 = prev_q = None
        elif c == 'H':
            nx = (x + p[0]) if rel else p[0]
            cur.append((nx, y))
            x = nx
            prev_c2 = prev_q = None
        elif c == 'V':
            ny = (y + p[0]) if rel else p[0]
            cur.append((x, ny))
            y = ny
            prev_c2 = prev_q = None
        elif c == 'C':
            if len(p) < 6:
                cur_cmd = None; break
            # 参数 = (c1x,c1y, c2x,c2y, x,y) 共 6 个 ⇒ 取点 key 是 (0,2,4)，
            #   终点取 (p[4],p[5])。🔴 早先误写成 (0,2,4,6) 会越界。
            pts = [(x + p[k], y + p[k+1]) if rel else (p[k], p[k+1]) for k in (0, 2, 4)]
            end = (x + p[4], y + p[5]) if rel else (p[4], p[5])
            cur.extend(bezier3((x, y), pts[0], pts[1], end))
            prev_c2 = pts[1]
            prev_q = None
            x, y = end
        elif c == 'S':
            if len(p) < 4:
                cur_cmd = None; break
            # 参数 = (c2x,c2y, x,y) ⇒ 取点 key (0,2)，终点 (p[2],p[3])
            pts = [(x + p[k], y + p[k+1]) if rel else (p[k], p[k+1]) for k in (0, 2)]
            end = (x + p[2], y + p[3]) if rel else (p[2], p[3])
            first = (2*x - prev_c2[0], 2*y - prev_c2[1]) if prev_c2 else (x, y)
            cur.extend(bezier3((x, y), first, pts[0], end))
            prev_c2 = pts[0]
            prev_q = None
            x, y = end
        elif c == 'Q':
            pts = [(x + p[k], y + p[k+1]) if rel else (p[k], p[k+1]) for k in (0, 2)]
            cur.extend(bezier2((x, y), pts[0], pts[1]))
            prev_q = pts[0]
            prev_c2 = None
            x, y = pts[1]
        elif c == 'T':
            q = (2*x - prev_q[0], 2*y - prev_q[1]) if prev_q else (x, y)
            e = (x + p[0], y + p[1]) if rel else (p[0], p[1])
            cur.extend(bezier2((x, y), q, e))
            prev_q = q
            prev_c2 = None
            x, y = e
        elif c == 'A':
            e = (x + p[5], y + p[6]) if rel else (p[5], p[6])
            seq = arc_to_beziers((x, y), p[0], p[1], p[2], int(p[3]), int(p[4]), e)
            cur.extend(bezier3((x, y), seq[0], seq[1], seq[2]))
            if len(seq) > 3:
                cur.extend(bezier3(seq[2], seq[3], seq[4], seq[5]))
            x, y = e
            prev_c2 = prev_q = None
        elif c == 'Z':
            if cur:
                cur.append((sx, sy))
                polys.append(cur)
                cur = [(sx, sy)]
            x, y = sx, sy
            prev_c2 = prev_q = None
    if cur:
        polys.append(cur)
    return [[(px * scale + ox, py * scale + oy) for (px, py) in poly] for poly in polys]


# ---------- 主流程 ----------
VB_RE = re.compile(r'viewBox\s*=\s*["\']([-\d.eE\s]+)["\']')
NUMATTR = re.compile(r'([A-Za-z:]+)\s*=\s*["\']([-+0-9.eE]+)["\']')


def _num(tag, key, default):
    """从标签字符串里取属性数值（取不到用 default）。"""
    m = re.search(r'(?:^|\s)' + re.escape(key) + r'\s*=\s*["\']([-+0-9.eE]+)["\']', tag)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return default
    return default


def fill_even_odd(size, polys, rgba):
    """even-odd 环绕填充（自建扫描线，Pillow 的 polygon 只有 nonzero 近似）。

    为什么需要：这些图标是**单路径多子轮廓**（外轮廓 + 内部挖孔），
    逐子路径 fill 会把洞填实（渲染出来是一坨方块）⇒ 必须按 even-odd 规则
    对「同一水平扫描线上被路径穿越的次数」决定像素内外。
    """
    ss = size
    px = Image.new('RGBA', (ss, ss), (0, 0, 0, 0))
    buf = bytearray(ss * ss)
    edges = []   # (y0, y1, x_at_y0, dx/dy)
    for poly in polys:
        n = len(poly)
        for i in range(n):
            x0, y0 = poly[i]
            x1, y1 = poly[(i + 1) % n]
            if y0 == y1:
                continue
            edges.append((y0, y1, x0, (x1 - x0) / (y1 - y0)))
    if not edges:
        return px

    r, g, b, a = rgba
    for py in range(ss):
        yc = py + 0.5
        xs = []
        for (y0, y1, x0, dxdy) in edges:
            if (y0 <= yc < y1) or (y1 <= yc < y0):
                xs.append(x0 + (yc - y0) * dxdy)
        if not xs:
            continue
        xs.sort()
        # even-odd：成对填充 [xs0,xs1) [xs2,xs3) ...
        base = py * ss
        for k in range(0, len(xs) - 1, 2):
            x_start = max(0, int(round(xs[k])))
            x_end = min(ss, int(round(xs[k + 1])))
            if x_end <= x_start:
                continue
            for pxx in range(x_start, x_end):
                buf[base + pxx] = 1

    # RGBA 上色
    data = bytearray(ss * ss * 4)
    for i in range(ss * ss):
        if buf[i]:
            data[i*4:i*4+4] = bytes((r, g, b, a))
    px = Image.frombytes('RGBA', (ss, ss), bytes(data))
    return px


def render(svg_path, png_path, size, rgba=(240, 190, 60, 255), ss=4):
    src = open(svg_path, 'r', encoding='utf-8').read()
    vb = VB_RE.search(src)
    if vb:
        parts = [float(v) for v in vb.group(1).replace(',', ' ').split()]
        minx, miny, vbw, vbh = parts[0], parts[1], parts[2], parts[3]
    else:
        minx = miny = 0.0
        vbw = vbh = 24.0

    ds = re.findall(r'\sd\s*=\s*["\']([^"\']+)["\']', src)
    if not ds:
        m = re.search(r'<path[^>]*\sd\s*=\s*["\']([^"\']+)["\']', src)
        ds = [m.group(1)] if m else []
    # 🔴 有些图标不含 <path>，只有 <rect>/<circle>（纯形状用 rect/circle 画）
    if not ds:
        shapes = []
        for m in re.finditer(r'<rect[^>]*>', src):
            tag = m.group(0)
            x = _num(tag, 'x', 0.0); y = _num(tag, 'y', 0.0)
            w = _num(tag, 'width', 0.0); h = _num(tag, 'height', 0.0)
            if w <= 0 or h <= 0:
                continue
            shapes.append('M%.4f %.4f H%.4f V%.4f H%.4f Z' % (x, y, x + w, y + h, x))
        for m in re.finditer(r'<circle[^>]*>', src):
            tag = m.group(0)
            cx = _num(tag, 'cx', 0.0); cy = _num(tag, 'cy', 0.0); r = _num(tag, 'r', 0.0)
            if r <= 0:
                continue
            k = r * 0.5523
            d = ('M%.4f %.4f C%.4f %.4f %.4f %.4f %.4f %.4f '
                 'C%.4f %.4f %.4f %.4f %.4f %.4f '
                 'C%.4f %.4f %.4f %.4f %.4f %.4f '
                 'C%.4f %.4f %.4f %.4f %.4f %.4f Z') % (
                cx, cy - r, cx + k, cy - r, cx + r, cy - k, cx + r, cy,
                cx + r, cy + k, cx + k, cy + r, cx, cy + r,
                cx - k, cy + r, cx - r, cy + k, cx - r, cy,
                cx - r, cy - k, cx - k, cy - r, cx, cy - r)
            shapes.append(d)
        for m in re.finditer(r'<ellipse[^>]*>', src):
            tag = m.group(0)
            cx = _num(tag, 'cx', 0.0); cy = _num(tag, 'cy', 0.0)
            rx = _num(tag, 'rx', 0.0); ry = _num(tag, 'ry', 0.0)
            if rx <= 0 or ry <= 0:
                continue
            kx, ky = rx * 0.5523, ry * 0.5523
            shapes.append(
                ('M%.4f %.4f C%.4f %.4f %.4f %.4f %.4f %.4f '
                 'C%.4f %.4f %.4f %.4f %.4f %.4f '
                 'C%.4f %.4f %.4f %.4f %.4f %.4f '
                 'C%.4f %.4f %.4f %.4f %.4f %.4f Z') % (
                    cx, cy - ry,
                    cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy,
                    cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry,
                    cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy,
                    cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry))
        for m in re.finditer(r'<polygon[^>]*>', src):
            tag = m.group(0)
            pm = re.search(r'\bpoints\s*=\s*["\']([^"\']+)["\']', tag)
            if not pm:
                continue
            nums = [float(v) for v in re.findall(r'[-+]?[0-9]*\.?[0-9]+', pm.group(1))]
            pts = list(zip(nums[0::2], nums[1::2]))
            if len(pts) >= 3:
                shapes.append('M' + ' '.join('%.4f %.4f' % p for p in pts) + ' Z')
        for m in re.finditer(r'<polyline[^>]*>', src):
            tag = m.group(0)
            pm = re.search(r'\bpoints\s*=\s*["\']([^"\']+)["\']', tag)
            if not pm:
                continue
            nums = [float(v) for v in re.findall(r'[-+]?[0-9]*\.?[0-9]+', pm.group(1))]
            pts = list(zip(nums[0::2], nums[1::2]))
            if len(pts) >= 3:
                shapes.append('M' + ' '.join('%.4f %.4f' % p for p in pts) + ' Z')
        for m in re.finditer(r'<line[^>]*>', src):
            tag = m.group(0)
            x1 = _num(tag, 'x1', 0.0); y1 = _num(tag, 'y1', 0.0)
            x2 = _num(tag, 'x2', 0.0); y2 = _num(tag, 'y2', 0.0)
            t = 0.6  # 加粗成可见的窄条
            dx, dy = x2 - x1, y2 - y1
            ln = (dx * dx + dy * dy) ** 0.5 or 1.0
            nx, ny = -dy / ln * t, dx / ln * t
            shapes.append('M%.4f %.4f L%.4f %.4f L%.4f %.4f L%.4f %.4f Z' % (
                x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny))
        if not shapes:
            raise SystemExit('no path d in ' + svg_path)
        ds = shapes

    big = size * ss
    scale = big / max(vbw, vbh)
    # viewBox 等比居中
    ox = (big - vbw * scale) / 2.0 - minx * scale
    oy = (big - vbh * scale) / 2.0 - miny * scale

    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    for d in ds:
        polys = path_to_polys(parse_path(d), scale, ox, oy)
        # 🔴 扫描线 even-odd 填充：单路径多子轮廓（外廓 + 挖孔）必须按环绕规则上色，
        #    逐子路径 fill 会把内部空洞填实。
        img = Image.alpha_composite(img, fill_even_odd(big, polys, rgba))

    img = img.resize((size, size), Image.LANCZOS)
    img.save(png_path)
    return png_path


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    sz = int(sys.argv[3]) if len(sys.argv) > 3 else 128
    col = (240, 190, 60, 255)
    if len(sys.argv) > 6:
        col = (int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]),
               int(sys.argv[7]) if len(sys.argv) > 7 else 255)
    print(render(src, dst, sz, col))