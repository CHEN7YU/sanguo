#!/usr/bin/env python3
"""Build the canonical Tiger Gate battle audit from decoded original resources."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from build_level01_audit import (
    AI_NAMES,
    NAME_SIMPLIFIED,
    TERRAIN_NAMES,
    TROOP_BASE,
    derived_stats,
    instruction_bytes,
    message_at,
    message_series_at,
    parse_enemy_deployment,
    parse_friend_deployment,
    sha256,
    split_instructions,
)


NAME_SIMPLIFIED.update({
    "呂布": "吕布",
    "張遼": "张辽",
    "侯成": "侯成",
    "宋憲": "宋宪",
    "魏續": "魏续",
    "弓兵隊": "弓兵队",
})


def simplify(name: str) -> str:
    return NAME_SIMPLIFIED.get(name, name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("raw_dump", type=Path)
    parser.add_argument("map_json", type=Path)
    parser.add_argument("game_dir", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    raw = json.loads(args.raw_dump.read_text(encoding="utf-8"))
    map_data = json.loads(args.map_json.read_text(encoding="utf-8"))
    backend = Path(__file__).resolve().parent / "research" / "reko3editor-src" / "reko3editor-master" / "backend"
    import sys
    sys.path.insert(0, str(backend))
    from libs import data_maps  # type: ignore

    payload = instruction_bytes(raw, 7, 0)
    instructions = split_instructions(payload, data_maps.code_step)
    friend_instr = next(x for x in instructions if x[0] == 0x03)
    enemy_instr = next(x for x in instructions if x[0] == 0x22)
    friends = parse_friend_deployment(friend_instr)
    enemies = parse_enemy_deployment(enemy_instr)
    characters = raw["characters"]
    initial = raw["initial_characters"]

    units = []
    for entry in friends["units"]:
        avatar_id = entry["avatar_id"]
        char = characters[avatar_id]
        first = initial[avatar_id]
        item_ids = [x["id"] for x in first["daoju_list"]]
        unit = {
            **entry,
            "side": "player" if avatar_id in (0, 1, 2) else "guest",
            "name_original": char["name"],
            "name": simplify(char["name"]),
            "troop_id": first["bingzhong_id"],
            "troop_original": first["bingzhong"],
            "baseline_level_before_carryover": first["level"],
            "carryover_from_previous_battle": True,
            "wuli": char["wuli"],
            "zhili": char["zhili"],
            "tongyu": char["tongyu"],
            "items_before_carryover": [{"id": item["id"], "name": item["name"]["name"]} for item in first["daoju_list"]],
        }
        unit.update(derived_stats(char, first["bingzhong"], first["level"], item_ids))
        units.append(unit)

    for entry in enemies:
        avatar_id = entry["avatar_id"]
        char = characters[avatar_id]
        troop = raw["troop_types"][entry["troop_id"]]
        unit = {
            **entry,
            "side": "enemy",
            "name_original": char["name"],
            "name": simplify(char["name"]),
            "troop_original": troop,
            "wuli": char["wuli"],
            "zhili": char["zhili"],
            "tongyu": char["tongyu"],
            "items": [],
        }
        unit.update(derived_stats(char, troop, entry["level"], []))
        units.append(unit)

    map_codes = map_data["terrain_codes"]
    special_tiles = []
    for y, row in enumerate(map_codes):
        for x, terrain_id in enumerate(row):
            if terrain_id in (4, 8, 10, 13, 14, 15, 16):
                special_tiles.append({"x": x, "y": y, "terrain_id": terrain_id, "terrain": TERRAIN_NAMES[terrain_id]})

    level_one = json.loads((args.output.parent / "level-01-original.json").read_text(encoding="utf-8"))
    original_rules = dict(level_one["original_rules"])
    original_rules["second_battle_intrinsic_strategies"] = (
        "刘备、关羽、张飞的实际等级与经验从汜水关存档继承；按原版兵种与等级学习表逐人判定，"
        "轻骑兵未到8级不能使用牵制，骑兵不获得援助。"
    )

    result = {
        "schema": 1,
        "battle": {
            "chapter": "序章",
            "name": "虎牢关之战",
            "map_id": 1,
            "turn_limit": friends["turn_limit"],
            "objective": "击退吕布军",
            "defeat": "刘备撤退或超过30回合",
        },
        "sources": {
            "game_dir": str(args.game_dir.resolve()),
            "BAKDATA.R3_sha256": sha256(args.game_dir / "BAKDATA.R3"),
            "MAIN.EXE_sha256": sha256(args.game_dir / "MAIN.EXE"),
            "SNR0D.R3_sha256": sha256(args.game_dir / "SNR0D.R3"),
            "SNR0M.R3_sha256": sha256(args.game_dir / "SNR0M.R3"),
            "HEXZMAP.R3_sha256": sha256(args.game_dir / "HEXZMAP.R3"),
        },
        "map": {**map_data, "special_tiles": special_tiles},
        "commanders": {
            "player": simplify(characters[friends["player_commander_id"]]["name"]),
            "enemy": simplify(characters[friends["enemy_commander_id"]]["name"]),
        },
        "units": units,
        "events": {
            "battle_music_id_original": 16,
            "remaster_battle_track": "assets/audio/hulao-lubu-theme.mp3",
            "prebattle_march_dialogue": [
                message_at(raw, offset) for offset in (0x107B, 0x10B9, 0x1112, 0x1133, 0x115E, 0x117B)
            ],
            "objective_text": message_at(raw, 0x11A2)["text"],
            "opening_dialogue": message_series_at(raw, 0x11B3),
            "duel": {
                "pair": ["张飞", "吕布"],
                "result": "吕布撤退，张飞直接升1级，战斗结束",
                "dialogue": [message_at(raw, offset) for offset in (0x1301, 0x13C8, 0x1400, 0x1466, 0x149E, 0x14B1)],
            },
            "turn_18": {
                "dialogue": message_series_at(raw, 0x14C0),
                "change_ai": {"unit": "吕布", "from": 2, "to": 1, "meaning": AI_NAMES[1]},
            },
            "normal_victory": message_series_at(raw, 0x1511),
            "treasure": {"tile": {"x": 10, "y": 13}, "reward": "焦热书×1", "one_time": True},
            "supply": {"tile": {"x": 11, "y": 14}, "reward": "豆×1", "one_time": True},
            "occupation_text": message_at(raw, 0x1549)["text"],
            "battle_reward": "金100",
        },
        "original_rules": original_rules,
        "audit_notes": [
            "虎牢关地图、部署、回合、宝物、兵粮、张飞单挑吕布和第18回合吕布主动出击均直接来自用户原游戏文件。",
            "刘备、关羽、张飞、公孙瓒、陶谦的等级、经验、兵力、道具与宝物必须从汜水关战后存档继承，不能在第二关重置。",
            "原版公孙瓒与陶谦由事件开关决定出场；本重制版按用户决定固定随军。",
            "原版没有刘备10%光环；该效果属于用户指定的重制扩展，只影响友方。",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "units": len(units), "map": [map_data["width"], map_data["height"]]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
