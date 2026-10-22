# 淮南剧情补全 v246

## 原作依据与制作范围

`docs/original-audit/chapter-1-raw.json`，SNR1D.R3 第2页：第9段徐州诏命与出征交谈；第10段淮南议事；第11段小沛议事；第13段战后赴许昌；第14段曹操接纳。对白转换简体、调整标点，运行时保留原文/演义口吻选择。

- 原文地址 0x1cc7–0x1e4a：纪灵告急、袁胤献计、联络吕布。
- 0x1e5e–0x2153：袁术书信、陈宫劝夺徐州、吕布犹疑、张辽反对、侯成劝解。
- 0x2520–0x25b4：张飞欲回徐州，关羽建议赴许昌，刘备同意。
- 0x25da、0x26ad–0x2741：曹操询问、刘备求助、安排官邸。
- 赵云及糜氏兄弟的出征交谈为衔接补写，不冒充原作逐字对白。
- 36段连续战前剧情、选关另加1段前情；两条战后演出各9段。全灭与撤退各自开场，再汇合赴许昌。未制作或声称开放下一关战斗。

## 背景

内置 ImageGen 生成，未使用CLI。母版：`assets-master/level-10-huainan/huainan-council-hall-v1.png`；运行图：`assets/level-10-huainan/huainan-council-hall-v1.webp`（1536×864，332694字节）。独立场景路由，不再借用徐州背景。小沛/许昌仍使用既有议事厅美术。

生成提示：Create a finished empty environment background for a Chinese Three Kingdoms tactical RPG story scene: Yuan Shu's lavish Huainan council hall, late Eastern Han dynasty. Wide 16:9 landscape 1536x864 or equivalent. Elevated three-quarter isometric-like camera looking down into hall, matching classic HD-2D hand-painted game backgrounds, detailed painted wood and stone with crisp contours, warm restrained gold and vermilion, no photographic realism. IMPORTANT composition: large uncluttered flat floor occupies middle and lower two thirds, suitable for overlaying seven small animated characters. Throne platform along far upper-right wall, low dark lacquer throne desk and golden screen behind, a clear empty standing spot in front of throne at 75% width 35% height. A low broad platform edge with shallow stairs, all floor geography legible. Rich dark red columns on outside edges only, gilded carved beams, silk hangings at edges, bronze ceremonial vessels against back wall, subtle dragon ornament expressing Yuan Shu's extravagant usurpation. Daylight from left windows, warm interior lamps, mild cast shadows. Keep center open and clear, furniture never blocks character staging area. No people, no soldiers, no horses, no writing, no UI, no logos, no watermark. Entire image filled with environment, no border.

## 奖励与存档

奖励仍只在 victory() 内结算一次。战后剧情使用 postbattle 阶段保存完整部队、地图、金钱、分支、对白位置和人物站位。读取剧情档只恢复已结算状态，跳过只标记演出完成。淮南加入云档可用关卡，但泰山→淮南的入口约束仍保留。旧版淮南战前对白序号不能对应新剧本，恢复时从新开场重播，不改奖励。

## 已观察到的浏览器证据

2026-10-22，独立 localhost:4181 测试源，Codex内置浏览器：

- 正常战前剧情进入自由交谈；点击孙乾后刘备寻路、显示诏命疑问；与关羽完成两句交谈后进入出征。
- 独立淮南厅背景正常加载，7名人物站在厅内；初始袁术朝向已调整并截图复查，面向群臣。
- 全灭预览触发实际 victory()：初始金500变900，刘备Lv15经验50。自动播放9段后进入结局；自动档读取两次，金钱与经验保持不变。
- 撤退预览：金500，刘备Lv16经验0（过关50+存活50），其他存活部队经验50。手动保存档位1，跳过，读回档位1，自动播放完成；数值保持一致。
- 这些是结算/剧情专项预览实测，不等于从新游戏连续打完战役，也不等于手机真机测试。

## 最终专项验收

- 淮南议事厅第6段至第37段自动播放后正常进入整备；小沛6名人物最终截图可见，补齐张辽、侯成、宋宪、魏续的通用四方向步行图集映射，吕布使用既有专属图集。
- 小沛第17段手动保存到测试档位2，重新导航读档后仍为第17段，6名人物、金500和对白正确。
- 撤退战后第3/9段自动档读回仍为关羽建议赴许昌，正常推进至第5段；许昌人物站位、头像已截图复查。
- 从许昌场景跳过，返回标题再点继续游戏，正确恢复“战后已结算”；金500、刘备Lv16/EXP0、关羽及其他存活单位EXP50不变。
- 自动回归通过：verify_huainan_story、verify_level10_huainan、verify_early_access_campaign、verify_prebattle_story、verify_early_story_roam、verify_chapter1_hd2d_story、verify_story_visual_assets、verify_julu_story_dismount、verify_cloud_saves、verify_portable_saves、verify_turn_lock_recovery、verify_romance_dialogue、verify_audio_config。
- 剧情快照715条；发布构建436个运行文件、160.27 MiB，399个素材引用全部存在。
- 网页专项实测在内置浏览器进行；未宣称手机真机验收或从新游戏连续通关。本次未手动部署ChatGPT网站。
