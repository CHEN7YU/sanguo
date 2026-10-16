# 对白文本版本

当前游戏默认使用“易读的《三国演义》白话古文版”对白。

## 原文保留方式

- 各 `level-*.js` 与 `story-data.js` 中的原对白保持不变。
- `original-dialogue-snapshot-20261013.json` 保存了当前已制作关卡的原文对白使用点；泰山之战接入后共 624 个，便于审计和批量恢复。
- `dialogue-style.js` 只在显示时转换文本，不修改关卡对象、存档、事件条件或胜负逻辑。
- 地址加入 `?dialogue=original`（已有参数时加入 `&dialogue=original`）可运行原文版；该模式会在选关、读档、路线跳转和连续通关时保留。

## 后续新增对白

新对白仍写入对应的剧情或关卡数据文件。若句子已经符合白话古文风格，可直接显示；若原文偏现代口语，在 `dialogue-style.js` 的精确改写表中增加对应项。不要直接覆盖原文。

运行以下命令检查对白覆盖、原文恢复和脚本接入：

```powershell
node tools/verify_romance_dialogue.mjs
```
