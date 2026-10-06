import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "docs" / "original-audit" / "chapter-0-raw.json").read_text(encoding="utf-8"))
targets = {"刘备", "关羽", "张飞", "曹操", "袁绍", "袁术", "董卓", "吕布", "华雄", "李儒", "孔融", "公孙瓒", "陶谦", "董承", "李肃", "胡轸", "李傕", "郭汜", "赵岑"}
for index, character in enumerate(data["characters"]):
    name = character.get("name", "")
    if name in targets:
        print(index, character)
