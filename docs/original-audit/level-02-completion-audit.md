# 第二关“虎牢关之战”完成审计

审计日期：2026-09-27  
公开测试版：Sites 版本 33  
范围：第二关战斗及其战前整备、行军对白、开战对白、结算与第一关继承；不包含尚未制作的第三关“洛阳之战”。

| 要求 | 当前实现 | 主要证据 |
| --- | --- | --- |
| 原作关卡骨架 | 16×24 原版地形码、12 个参战单位、原始出生位置与基础属性、30 回合、吕布为目标 | `level-02.js`；`level-02-original.json`；`verify_level02.mjs` |
| 原作事件 | 战前行军 5 句、开战 8 句、第 18 回合吕布出击、宝物库焦热书、兵粮库豆、普通胜利、张飞单挑吕布 | `level-02.js`；`verify_level02.mjs`；浏览器事件预览 |
| 原作规则 | 兵种移动类别、地形消耗与防御、伤害、反击、经验、升级、恢复、策略学习条件 | `battle-rules.js`；`verify_battle_rules.cjs`；`verify_strategy_access.mjs` |
| 现代化地图 | 2K 级虎牢关轴测绘图、方格判定、桥梁通行、建筑格、主地图与小地图同步 | `assets/hulao-remaster-v1.webp`；浏览器实机检查 |
| 地图动态 | 第二关专属树林摆动遮罩与横向河道流纹，流纹避开桥面 | `level-02.js` 的 `environmentFx`；`drawEnvironmentFx`；浏览器实机检查 |
| 单位表现 | 一个单位显示一个主体；有姓名武将使用专属战场图、四向行走、攻击与死亡素材；普通弓兵使用通用兵种动作 | `game.js` 素材映射；`level-02-animation-bounds.js`；`verify_level02.mjs` |
| 张辽骑乘表现 | 骑马待机、四向行进、马上挥刀、落马退场与马蹄声；战斗数值仍按原版短兵 | `mountedVisual`；四套张辽骑乘素材；`verify_level02.mjs`；浏览器动作预览 |
| 战斗反馈 | 武器对应音效、蓄力会心、武器格挡、受伤、闪避、死亡、马蹄与落马音效 | `battle-sfx.js`；`verify_battle_sfx.mjs`；动作预览 |
| 单挑 | 张飞与吕布专用 7.2 秒多回合交锋，双方接触、武器碰撞、吕布拨马撤退；张飞直接升一级并结束战斗 | `playDuelCinematic`；`startDuel`；浏览器 `duelPreview` 与 `duelEventPreview` |
| 人物对白与头像 | 第二关全部有姓名对白角色使用对应重绘头像；所有有姓名武将有撤退台词 | `portraitPaths`；`level-02.js`；`verify_level02.mjs` |
| 刘备光环 | 只影响相邻我军与盟军，所有战斗属性 +10%；选中单位时明确显示；刘关张合兵触发对白 | `hasXuandeAura`、`effectiveStat`、`playBrotherMergeDialogue`；`verify_strategy_access.mjs` |
| 盟军控制 | 公孙瓒、陶谦固定参战并自动行动；不能击杀吕布夺走最后一击 | `guestPhase`、`bossProtected`；`verify_level02.mjs` |
| 操作提示 | 路径与累计消耗、单位专属地形通行提示、攻击结果区间、命中/会心/格挡/反击、敌军危险区 | `updateTerrainInfo`、`showForecast`、`rebuildDangerTiles`；浏览器验证“张飞·森林不可进入” |
| 胜败与奖励信息 | 常驻显示胜利和败北条件；建筑提示读取当前关卡事件，虎牢宝物库显示焦热书×1 | `defeatCondition`、`terrainEventEffect`；浏览器实机检查 |
| 存档与继承 | 手动 6 槽、自动存档、本机持久化、跨关卡读取；继承等级、经验、兵力、士气、策略、道具、宝物和军资金 | `makeSnapshot`、`loadSnapshot`、`applyCampaignTransfer`；`verify_level02.mjs` |
| PC 与触屏 | 鼠标、键盘、触屏点击、双指缩放、拖动、横屏提示、全屏；1080p/1440p/4K 自适应 | `game.js` 输入逻辑；844×390 手机横屏公开版实测 |
| 音乐 | 虎牢关使用用户指定的 `Theme of Lu Bu ～Beat Mix～`，与剧情音乐分离 | `audio-config.js`；`verify_audio_config.mjs` |
| 公开测试版 | 公共网址无需 ChatGPT 登录；版本 33 已发布并读取最新资源缓存键 | Sites 部署 `appgdep_6ab92111c6c8819191707805558c8c35`；公开网页脚本核对 |

最终自动验证必须全部通过：

- `verify_audio_config.mjs`
- `verify_battle_rules.cjs`
- `verify_battle_sfx.mjs`
- `verify_directional_attack.mjs`
- `verify_level01.mjs`
- `verify_level02.mjs`
- `verify_mounted_death.mjs`
- `verify_prebattle_story.mjs`
- `verify_strategy_access.mjs`
- `verify_treasure_transfer.mjs`
- `verify_walk_animation.mjs`

