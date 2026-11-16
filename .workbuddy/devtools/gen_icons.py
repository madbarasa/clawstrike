#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_icons.py —— 从 game-icon-pack（CC0）批量产出德州扑克用图标 PNG

来源：https://github.com/Nieobie/game-icon-pack（CC0 1.0 Universal，免署名可商用）
用法：python gen_icons.py <svg_root> <out_dir> [size]

挑图原则（伊达 2026-10-15）：优先语义贴题的扑克/筹码/Boss/状态类，
不要泛用 UI 图标（箭头/齿轮这类引擎已能表达）。
"""
import os
import sys
import subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svg2png_lite import render  # noqa: E402

# 语义名 → (svg 相对路径, 项目内用途)
PICKS = {
    # —— 扑克核心 ——
    'card':            ('1-game/card.svg',            '通用牌'),
    'cards':           ('1-game/cards.svg',           '多张牌'),
    'spade-card':      ('1-game/spade-card.svg',      '黑桃'),
    'heart-card':      ('1-game/heart-card.svg',      '红心'),
    'diamond-card':    ('1-game/diamond-card.svg',    '方块'),
    'club-card':       ('1-game/club-card.svg',       '梅花'),
    # —— 筹码 / 货币 ——
    'chip':            ('2-items/coin.svg',           '筹码/现金'),
    'coin':            ('2-items/coin.svg',           '金币'),
    'money':           ('2-items/money.svg',          '钞票'),
    'treasure':        ('2-items/treasure.svg',       '宝箱'),
    # —— 等级 / 成长 ——
    'level':           ('1-game/level.svg',           '等级'),
    'experience':      ('1-game/experience-points.svg','经验/炫技分'),
    'mana':            ('1-game/mana-points.svg',     '法力/筹码池'),
    'star':            ('11-symbols/star.svg',        '星级'),
    # —— 状态 / 威胁 ——
    'boss':            ('1-game/boss.svg',            'Boss'),
    'skull':           ('1-game/death.svg',           '淘汰/死亡'),
    'ghost':           ('1-game/ghost.svg',           '鬼手/灵异'),
    'demon':           ('1-game/demon.svg',           '出千/恶鬼'),
    'health':          ('1-game/health.svg',          '生命/筹码'),
    'shield':          ('3-gear/shield.svg',          '防御/底牌'),
    'sword':           ('3-gear/sword.svg',           '攻击/加注'),
    # —— 特殊状态 ——
    'fire':            ('4-nature/fire.svg',          '火/热'),
    'lightning':       ('4-nature/lightning.svg',     '雷/闪电'),
    'target':          ('1-game/target.svg',          '瞄准/读人'),
    'eye':             ('8-ui/eye.svg',               '观察/读人'),
    'brain':           ('1-game/brain.svg',           '读心/算计'),
    'mask':            ('1-game/mask.svg',            '面具/伪装'),
    'crown':           ('3-gear/crown.svg',           '皇家/称王'),
    'trophy':          ('1-game/trophy.svg',          '胜利/奖杯'),
    'dice':            ('1-game/dice.svg',            '随机/骰子'),
    'hourglass':       ('11-symbols/hourglass.svg',   '倒计时/耐心'),
    'lock':            ('3-gear/lock.svg',            '锁定/不可用'),
    'key':             ('3-gear/key.svg',             '解锁'),
}


def main():
    root = sys.argv[1]
    out = sys.argv[2]
    size = int(sys.argv[3]) if len(sys.argv) > 3 else 128
    os.makedirs(out, exist_ok=True)
    ok, miss = [], []
    for name, (rel, _usage) in PICKS.items():
        src = os.path.join(root, 'svg', 'no-padding', rel)
        dst = os.path.join(out, name + '.png')
        if not os.path.exists(src):
            miss.append((name, rel))
            continue
        try:
            render(src, dst, size, (255, 255, 255, 255))
            ok.append(name)
        except Exception as e:      # noqa: BLE001
            miss.append((name, '%s: %s' % (rel, str(e)[:50])))
    print('generated %d:' % len(ok))
    print('  ' + ', '.join(sorted(ok)))
    if miss:
        print('missing %d:' % len(miss))
        for n, r in miss:
            print('  %-12s %s' % (n, r))


if __name__ == '__main__':
    main()