#!/usr/bin/env python3
"""Build the canonical first-battle audit from decoded original resources."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
from pathlib import Path


TERRAIN_NAMES = [
    "平原", "森林", "山地", "河流", "桥梁", "城墙", "城内", "草原", "村庄", "悬崖",
    "城门", "荒地", "栅栏", "鹿砦", "兵营", "粮仓", "宝物库", "房舍", "火焰", "浊流",
]
TROOP_BASE = {
    "短兵": {"group": "infantry", "attack": 40, "defense": 40, "hp": 500, "hp_growth": 50, "move": 4},
    "弓兵": {"group": "archer", "attack": 30, "defense": 40, "hp": 500, "hp_growth": 40, "move": 4},
    "輕騎兵": {"group": "cavalry", "attack": 60, "defense": 30, "hp": 500, "hp_growth": 60, "move": 6},
}
ATTACK_BONUS = {0x0C: 12, 0x0F: 10}
AI_NAMES = {0: "原地警戒（可攻击）", 1: "主动出击", 2: "原地待命", 3: "主动攻击指定目标", 4: "向坐标移动并攻击", 6: "向坐标移动但不攻击"}
NAME_SIMPLIFIED = {
    "劉備": "刘备", "關羽": "关羽", "張飛": "张飞", "華雄": "华雄", "李肅": "李肃",
    "胡軫": "胡轸", "趙岑": "赵岑", "公孫瓚": "公孙瓒", "陶謙": "陶谦", "步兵隊": "步兵队",
}


def little(data: bytes) -> int:
    return int.from_bytes(data, "little")


def split_instructions(payload: bytes, code_step: dict[int, dict]) -> list[bytes]:
    out: list[bytes] = []
    pos = 0
    while pos < len(payload):
        opcode = payload[pos]
        if opcode in (0x20, 0x32):
            plen = payload[pos + 1] + 1
            if opcode == 0x20 and plen > 0x80:
                plen -= 0x80
        elif opcode == 0x21:
            true_count = payload[pos + 2]
            false_count = payload[pos + 3 + true_count]
            plen = 3 + true_count + false_count
        else:
            plen = code_step[opcode]["plen"]
        end = pos + plen + 1
        out.append(payload[pos:end])
        pos = end
    return out


def instruction_bytes(raw: dict, paragraph: int, section: int) -> bytes:
    encoded = raw["script"][0]["paragraph_list"][paragraph]["section_list"][section]["script_instr_bin"]
    return base64.b64decode(encoded)


def parse_friend_deployment(instr: bytes) -> dict:
    assert instr[0] == 0x03
    result = {
        "retreat_allowed": instr[1] == 0,
        "turn_limit": instr[2],
        "inherit_turns": instr[3],
        "enemy_commander_id": little(instr[6:8]),
        "player_commander_id": little(instr[10:12]),
        "units": [],
    }
    for index in range(30):
        start = 12 + index * 9
        avatar_id = little(instr[start:start + 2])
        if avatar_id == 0xFFFF:
            continue
        result["units"].append({
            "slot": index,
            "avatar_id": avatar_id,
            "x": instr[start + 2],
            "y": instr[start + 3],
            "appearance_mode": instr[start + 5],
            "appearance_event": instr[start + 6],
            "direction": instr[start + 7],
            "ambush": instr[start + 8],
        })
    return result


def parse_enemy_deployment(instr: bytes) -> list[dict]:
    assert instr[0] == 0x22
    result = []
    for index in range(30):
        start = 2 + index * 13
        avatar_id = little(instr[start:start + 2])
        if avatar_id == 0xFFFF:
            continue
        ai = instr[start + 8]
        result.append({
            "slot": index,
            "avatar_id": avatar_id,
            "x": instr[start + 2],
            "y": instr[start + 3],
            "appearance_mode": instr[start + 4],
            "appearance_event": instr[start + 5],
            "direction": instr[start + 6],
            "ambush": instr[start + 7],
            "ai_type": ai,
            "ai_name": AI_NAMES.get(ai, f"未知AI {ai}"),
            "ai_target": little(instr[start + 9:start + 11]),
            "troop_id": instr[start + 11],
            "level": instr[start + 12],
        })
    return result


def message_at(raw: dict, offset: int) -> dict:
    item = next(x for x in raw["messages"][0]["txt_list"] if x["addr_relate"] == offset)
    speaker_id = None if not item["name"] else int(item["name"], 16)
    return {"offset": offset, "speaker_id": speaker_id, "text": item["txt_descr"].strip()}


def message_series_at(raw: dict, offset: int) -> list[dict]:
    """Return every portrait line consumed by opcode 0x00's dialogue series.

    The script stores only the first text offset in the opcode. Subsequent portrait
    messages are contiguous in SNR0M.R3 and the series ends at the 0xffff marker.
    """
    messages = raw["messages"][0]["txt_list"]
    start = next(i for i, item in enumerate(messages) if item["addr_relate"] == offset)
    series = []
    for item in messages[start:]:
        if item["txt_code"].strip().lower() == "ff ff" or not item["txt_descr"].strip():
            break
        if item["txt_type"] != "带头像对话":
            break
        speaker_id = None if not item["name"] else int(item["name"], 16)
        series.append({"offset": item["addr_relate"], "speaker_id": speaker_id, "text": item["txt_descr"].strip()})
    return series


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def derived_stats(character: dict, troop: str, level: int, item_ids: list[int], morale: int = 100) -> dict:
    base = TROOP_BASE[troop]
    attack_bonus = sum(ATTACK_BONUS.get(item, 0) for item in item_ids)
    attack = ((4000 // (140 - character["wuli"]) + base["attack"] * 2 + morale) * (level + 10)) // 10
    defense = ((4000 // (140 - character["tongyu"]) + base["defense"] * 2 + morale) * (level + 10)) // 10
    attack = attack * (100 + attack_bonus) // 100
    max_hp = base["hp"] + base["hp_growth"] * (level - 1)
    max_strategy = (level + 10) * character["zhili"] * 5 // 200
    return {"max_hp": max_hp, "morale": morale, "attack": attack, "defense": defense, "move": base["move"], "max_strategy": max_strategy}


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

    friend_payload = instruction_bytes(raw, 4, 10)
    friend_instr = next(x for x in split_instructions(friend_payload, data_maps.code_step) if x[0] == 0x03)
    enemy_payload = instruction_bytes(raw, 5, 0)
    enemy_instr = next(x for x in split_instructions(enemy_payload, data_maps.code_step) if x[0] == 0x22)
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
            "name": NAME_SIMPLIFIED.get(char["name"], char["name"]),
            "troop_id": first["bingzhong_id"],
            "troop_original": first["bingzhong"],
            "level": first["level"],
            "exp": first["exp"],
            "wuli": char["wuli"],
            "zhili": char["zhili"],
            "tongyu": char["tongyu"],
            "items": [{"id": item["id"], "name": item["name"]["name"]} for item in first["daoju_list"]],
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
            "name": NAME_SIMPLIFIED.get(char["name"], char["name"]),
            "troop_original": troop,
            "wuli": char["wuli"],
            "zhili": char["zhili"],
            "tongyu": char["tongyu"],
            "items": [],
        }
        unit.update(derived_stats(char, troop, entry["level"], []))
        units.append(unit)

    main_exe = (args.game_dir / "MAIN.EXE").read_bytes()
    move_classes = list(main_exe[0x3A426:0x3A439])
    move_costs = [list(main_exe[0x3A43A + row * 20:0x3A43A + (row + 1) * 20]) for row in range(4)]
    terrain_defense = list(main_exe[0x3A48A:0x3A49D])
    terrain_rules = []
    for terrain_id, name in enumerate(TERRAIN_NAMES):
        terrain_rules.append({
            "id": terrain_id,
            "name": name,
            "defense_percent": None if terrain_id >= len(terrain_defense) or terrain_defense[terrain_id] == 0xFF else terrain_defense[terrain_id],
            "movement_cost_by_class": [None if row[terrain_id] == 0xFF else row[terrain_id] for row in move_costs],
        })

    map_codes = map_data["terrain_codes"]
    special_tiles = []
    for y, row in enumerate(map_codes):
        for x, terrain_id in enumerate(row):
            if terrain_id in (4, 8, 13, 15, 16):
                special_tiles.append({"x": x, "y": y, "terrain_id": terrain_id, "terrain": TERRAIN_NAMES[terrain_id]})

    result = {
        "schema": 1,
        "battle": {"chapter": "序章", "name": "汜水关之战", "map_id": 0, "turn_limit": friends["turn_limit"], "objective": "歼灭华雄", "defeat": "刘备撤退或超过30回合"},
        "sources": {
            "game_dir": str(args.game_dir.resolve()),
            "BAKDATA.R3_sha256": sha256(args.game_dir / "BAKDATA.R3"),
            "MAIN.EXE_sha256": sha256(args.game_dir / "MAIN.EXE"),
            "SNR0D.R3_sha256": sha256(args.game_dir / "SNR0D.R3"),
            "SNR0M.R3_sha256": sha256(args.game_dir / "SNR0M.R3"),
            "HEXZMAP.R3_sha256": sha256(args.game_dir / "HEXZMAP.R3"),
        },
        "map": {**map_data, "special_tiles": special_tiles},
        "commanders": {"player": NAME_SIMPLIFIED[characters[friends["player_commander_id"]]["name"]], "enemy": NAME_SIMPLIFIED[characters[friends["enemy_commander_id"]]["name"]]},
        "units": units,
        "events": {
            "battle_music_id": 19,
            "objective_text": message_at(raw, 0x0D63)["text"],
            "march_dialogue": [message_at(raw, 0x0D46)],
            "opening_dialogue": message_series_at(raw, 0x0D74),
            "treasure": {"tile": {"x": 6, "y": 7}, "script_coordinates_row_column": [7, 6], "reward": "金100", "one_time": True},
            "supply": {"tile": {"x": 12, "y": 6}, "script_coordinates_row_column": [6, 12], "reward": "豆×1", "one_time": True},
            "duel": {
                "pair": ["关羽", "华雄"],
                "result": "华雄撤退，关羽直接升1级，战斗结束",
                "dialogue": [message_at(raw, x) for x in (0x0EA2, 0x0F79, 0x0F88, 0x0FA8, 0x0FB9, 0x0FCE, 0x0FE1, 0x1011)],
                "animation_codes": [{"actor": "关羽", "code": x} for x in (0, 1, 0)] + [{"actor": "关羽", "code": 10}, {"actor": "华雄", "code": 3}, {"actor": "关羽", "code": 9}, {"actor": "关羽", "code": 2}],
            },
            "normal_victory": [message_at(raw, x) for x in (0x1034, 0x1045)],
            "battle_reward": "金100",
        },
        "original_rules": {
            "movement_class_by_troop": [{"troop_id": i, "troop": raw["troop_types"][i], "class": move_classes[i]} for i in range(19)],
            "movement_class_meanings": {"0": "步兵/弓兵/妖术师/民众", "1": "骑兵", "2": "军乐队/运输队", "3": "贼兵/武术家/猛兽/异民族"},
            "terrain": terrain_rules,
            "attack_formula": "((4000/(140-武力)+兵种基础攻击×2+士气)×(等级+10)/10)×(100+宝物攻击加成)/100；逐步整数除法",
            "defense_formula": "((4000/(140-统御)+兵种基础防御×2+士气)×(等级+10)/10)×(100+宝物防御加成)/100；逐步整数除法",
            "max_hp_formula": "兵种基础兵力+兵种兵力成长×(等级-1)",
            "max_strategy_formula": "(等级+10)×智力×5/200；整数除法",
            "physical_damage": "(攻击力-修正后防御力/2)×(100-地形防御%)/100；最低1，最高为目标当前兵力",
            "counterattack": "仅特定近战兵种可触发；攻击未击破、目标未混乱、非反击；0..149随机数小于防守者武力时反击，伤害减半",
            "experience": "未击破时按双方等级差计算基础经验；击破另加32/48或64/(等级差+2)；敌军不获经验",
            "original_physical_crit_block_dodge_combo": "已核对的原版物理规则中不存在独立会心、格挡、闪避或连击判定；重制版保留这些作为现代化扩展",
            "first_battle_intrinsic_strategies": "刘备、关羽、张飞等级不足以习得短兵Lv6焦热或轻骑兵Lv8牵制；本关原版可通过焦热书使用火攻，通过豆恢复",
        },
        "audit_notes": [
            "地图、部署、回合、目标、奖励、单挑文本与AI类型均直接来自用户原游戏文件。",
            "单位战斗属性按原版公式、开战士气100和脚本指定等级计算；士气100是开战默认状态。",
            "脚本的宝物触发坐标字段按行、列保存，已换算为地图x、y。",
            "原版没有本项目先前加入的刘备10%光环；该效果属于用户指定的重制扩展。",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "units": len(units), "map": [map_data["width"], map_data["height"]]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
