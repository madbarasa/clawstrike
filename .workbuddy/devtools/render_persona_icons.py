#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# render_persona_icons.py —— 渲染人设头像图标（game-icon-pack CC0）+ .meta
# 用法: python render_persona_icons.py
import os
import sys
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from svg2png_lite import render  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "icon_library", "game-icon-pack-main"))
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "assets", "UI", "icons"))

# 语义名 → svg 相对路径（no-padding 下）
PICKS = {
    "character": "1-game/character.svg",
    "death": "1-game/death.svg",
    "demon-02": "1-game/demon-02.svg",
    "halloween": "1-game/halloween.svg",
    "broadsword-02": "3-gear/broadsword-02.svg",
    "warrior-helmet-lv4": "3-gear/warrior-helmet-lv4.svg",
    "warrior-gloves-lv2": "3-gear/warrior-gloves-lv2.svg",
    "bear": "4-nature/bear.svg",
    "fox": "4-nature/fox.svg",
    "jellyfish": "4-nature/jellyfish.svg",
    "mouse": "4-nature/mouse.svg",
    "cow": "4-nature/cow.svg",
    "dog": "4-nature/dog.svg",
    "cat": "4-nature/cat.svg",
    "pig": "4-nature/pig.svg",
    "wolf": "4-nature/wolf.svg",
    "rabbit": "4-nature/rabbit.svg",
    "panda": "4-nature/panda.svg",
    "horse": "4-nature/horse.svg",
    "fish-02": "4-nature/fish-02.svg",
    "earthquake": "4-nature/earthquake.svg",
    "sheep": "4-nature/sheep.svg",
    "shrimp": "4-nature/shrimp.svg",
    "night": "4-nature/night.svg",
    "mace": "3-gear/mace.svg",
    "horn": "3-gear/horn.svg",
    "trident": "3-gear/trident.svg",
    "viking-helmet": "3-gear/viking-helmet.svg",
    "wand": "3-gear/wand.svg",
}

def main():
    os.makedirs(OUT, exist_ok=True)
    ok, miss = [], []
    for name, rel in PICKS.items():
        src = os.path.join(ROOT, "svg", "no-padding", rel)
        dst = os.path.join(OUT, name + ".png")
        if not os.path.exists(src):
            miss.append((name, rel + " (svg not found)"))
            continue
        try:
            render(src, dst, 128, (255, 255, 255, 255))
            meta = os.path.join(OUT, name + ".png.meta")
            with open(meta, "w", encoding="utf-8") as f:
                f.write('{\n  "uuid": "%s"\n}\n' % uuid.uuid4().hex[:22])
            ok.append(name)
        except Exception as e:  # noqa: BLE001
            miss.append((name, "%s: %s" % (rel, str(e)[:60])))
    print("rendered %d:" % len(ok))
    print("  " + ", ".join(sorted(ok)))
    if miss:
        print("missing %d:" % len(miss))
        for n, r in miss:
            print("  %-20s %s" % (n, r))
        sys.exit(1)

if __name__ == "__main__":
    main()
