---
name: "cdda-mod-writer"
description: "在TypeScript类型约束下编写CDDA mod JSON。当用户需要创建物品、怪物、配方等CDDA mod内容时调用。"
---

# CDDA Mod Writer

此技能帮助你在TypeScript类型约束下编写CDDA（Cataclysm: Dark Days Ahead）mod内容。

## 搜索范围限制（重要）

CDDA资料极其庞大，必须严格限制搜索范围：

**禁止操作**:
- 不要做任何不带确切位置的递归文件列举
- 不要尝试Glob整个data目录
- 不要全量读取md文件

**允许的搜索路径**:
1. `Schema/src/Schema/**/*.ts` - 类型定义
2. `游戏目录/data/json/**/*.json` - 游戏数据
3. `游戏目录/data/mods/**/*.json` - Mod数据
4. `游戏目录/doc/**/*.md` - 文档说明

## 数据源缺失处理

开始工作前，必须确认数据源是否可用。如缺失，使用 `AskUserQuestion` 工具向用户提问：

### @sosarciel-cdda/schema 缺失

**GitHub链接**: https://github.com/Sosarciel/sosarciel-cdda-schema

**处理方式**: 使用 `AskUserQuestion` 询问用户是否直接clone：
```
问题: "未找到 @sosarciel-cdda/schema 项目，是否需要clone到当前工作区？"
选项: 
- "是，直接clone" - 执行 git clone
- "否，我会手动处理" - 等待用户自行准备
```

### 游戏根目录缺失

**处理方式**: 使用 `AskUserQuestion` 询问用户：
```
问题: "未找到CDDA游戏根目录，请提供游戏目录路径，或选择获取方式："
选项:
- "提供路径" - 用户手动输入游戏目录绝对路径
- "下载指引" - 告知用户从 https://cataclysmdda.org/ 下载
```

## 工作流程

1. **检查数据源**: 确认schema项目和游戏目录是否可用，缺失则向用户提问

2. **理解需求**: 分析用户想要创建的CDDA内容类型（物品、怪物、配方等）

3. **搜索类型定义**:
   - 优先在 `Schema/src/Schema/` 搜索TypeScript类型
   - 找不到时再去 `doc/` 搜索文档说明
   - 仍有疑问时参考 `data/json/` 现有数据

4. **编写代码**: 在TypeScript类型约束下创建对象

5. **类型验证**: 使用 `tsc --noEmit` 验证代码类型正确性

6. **输出**: 询问用户需要的输出方式

## 数据源与搜索策略

本技能依赖两个主要数据源，搜索时必须严格遵循以下优先级和限制。

### 数据源一：@sosarciel-cdda/schema 项目

**GitHub**: https://github.com/Sosarciel/sosarciel-cdda-schema

**位置**: `Schema/src/Schema/**/*.ts`

**特点**: 提供简明的TypeScript类型描述，涵盖50%以上的常用类型定义

**搜索方式**: 
- 使用Grep在 `Schema/src/Schema/` 目录下搜索类型定义
- 大部分情况下在此搜索即可满足需求

**示例搜索**:
```
Grep pattern: "type Item" path: "Schema/src/Schema/"
Grep pattern: "Monster" path: "Schema/src/Schema/"
```

### 数据源二：游戏根目录

游戏根目录包含三个子数据源，按优先级排列：

#### 2.1 doc/**/*.md - 文档说明

**特点**: 人类可读的说明，但不一定准确

**重要限制**:
- **禁止以任何形式读取整个md文件** - 文件极其巨大
- 仅在schema项目中搜索不到时才来这里查找

**读取策略**:
1. 先用Grep搜索关键字所在行号
2. 读取该行号向下40行获取相关信息
3. 如信息不完整，继续向下读取

**索引读取**:
- 部分文件读取文件头部0-50行可看到简单索引
- 如索引不全，继续往下读

**示例**:
```
# 先搜索关键字位置
Grep pattern: '"type": "item"' path: "游戏目录/doc/" -n

# 假设找到在第100行，读取100-140行
Read file: "游戏目录/doc/ITEM.md" offset: 100 limit: 40
```

#### 2.2 data/json/**/*.json 与 data/mods/**/*.json - 游戏数据

**特点**: 包含所有游戏现有数据，可认定为"绝对正确"

**使用场景**:
- 当用户提出代码有错，但schema和doc均表示理应正确时
- 需要参考现有实现时

**搜索方式**:
```
Grep pattern: "具体ID或字段" path: "游戏目录/data/json/" glob: "*.json"
Grep pattern: "具体ID或字段" path: "游戏目录/data/mods/" glob: "*.json"
```

## 类型验证

编写完成后，**必须**使用TypeScript编译器验证类型正确性：

```bash
tsc --noEmit
```

如有类型错误，根据错误信息修正代码，直到验证通过。

## 常用类型速查

### 基础类型 (来自 GenericDefine.ts)
- `Weight`: `"1 g"`, `"1 kg"`, `"100 mg"`
- `Volume`: `"1 L"`, `"100 ml"`
- `Time`: `"1 turn"(就是1秒)`, `"1 s"`, `"1 m"`, `"1 h"`
- `Price`: `"1 USD"`, `"100 cents"`
- `Color`: `"red"`, `"blue"`, `"green"` 等

### 物品类型
```typescript
type Item = GenericBase & AnyItemTrait;

type ItemSubtype = "TOOL" | "ARMOR" | "GUN" | "AMMO" | "MAGAZINE" |
                "COMESTIBLE" | "BOOK" | "BIONIC_ITEM" | ...;
```

### EOC (effect_on_condition)

EOC是CDDA中用于触发条件效果的核心系统，可以理解为"当条件满足时执行效果"。

定义位置: `Schema/src/Schema/Eoc/Eoc.ts`

#### EOC基本结构

```typescript
type Eoc = {
    type: "effect_on_condition";
    id: EocID;                    // 唯一标识
    condition?: BoolExpr;         // 启用条件
    effect?: EocEffect[];         // 条件为真时执行的效果
    false_effect?: EocEffect[];   // 条件为假时执行的效果
} & EocTypeDefinition;            // 根据类型不同有不同字段
```

#### EOC类型

| 类型 | 说明 | 特殊字段 |
|-----|------|---------|
| `RECURRING` | 循环触发 | `recurrence`(间隔), `global`, `run_for_npcs`, `deactivate_condition` |
| `EVENT` | 事件触发 | `required_event`(触发事件) |
| `ACTIVATION` | 被动触发 | - |
| `SCENARIO_SPECIFIC` | 场景启动时调用一次 | - |
| `AVATAR_DEATH` | 主角死亡时触发 | - |
| `NPC_DEATH` | NPC死亡时触发 | - |

#### 常用事件 (EocEvent)

定义位置: `Schema/src/Schema/Eoc/EocEvent.ts`

| 事件 | 触发时机 |
|-----|---------|
| `character_dies` | 角色死亡 |
| `character_casts_spell` | 角色施法 |
| `character_kills_monster` | 角色杀死怪物 |
| `game_start` / `game_load` | 游戏开始/加载 |

#### EocEffect效果类型

EocEffect是EOC系统下的行为效果
每一条Effect都要独占一个对象位,避免在一个{...}内写多条eoc,多条eoc应通过对象数组的形式放入允许EocEffectList或类似位置
少数情况下存在字符串effect如"u_die"
定义位置: `Schema/src/Schema/Eoc/EocEffect/EocEffectIndex.ts`

**角色效果**:
| 效果 | 说明 |
|-----|------|
| `AddEffect` / `LoseEffect` | 添加/移除状态效果 |
| `AddTrait` / `LoseTrait` | 添加/移除特性 |
| `CastSpell` | 施放法术 |
| `Teleport` | 传送 |
| `Message` | 显示消息 |

**流程控制**:
| 效果 | 说明 |
|-----|------|
| `RunEocs` | 运行其他EOC |
| `IfCondition` | 条件判断 |
| `ForEach` | 遍历循环 |
| `MathAssignExp` | math赋值表达式 |

#### 示例：循环EOC

```typescript
const recurringEoc: Eoc = {
    type: "effect_on_condition",
    id: "EOC_my_recurring",
    eoc_type: "RECURRING",// 全局循环, 任何npc与玩家都会应用
    recurrence: "1 h",  // 每小时触发
    condition: { math: ["u_val('hunger') > 100"] },
    effect: [ { math: ["u_val('stamina')", "-=", "10"] } ]
};
```

#### 示例：事件EOC

```typescript
const eventEoc: Eoc = {
    type: "effect_on_condition",
    id: "EOC_on_eat",
    eoc_type: "EVENT",
    required_event: "character_eats_item",
    effect: [ { math: ["u_val('focus')", "+=", "5"] } ]
};
```

#### 示例：内联EOC

```typescript
// 内联EOC不需要type和id，直接在其他地方使用
const inlineEoc: InlineEoc = {
    condition: { math: ["u_val('strength') >= 10"] },
    effect: [
        { message: "You feel strong!" }//没有talker前缀(u_/n_)的message表示固定向主角发送消息
    ]
};
```

### Math表达式

Math表达式是一种EocEffect,用于EOC中的数值计算和条件判断的**文本表达式**

**重要限制**:
- math字符串内部**不能调用EOC**或另一个BoolExpr/NumberExpr
- 只能调用特殊常量和jmath定义的函数

#### Talker前缀

在math表达式中调用jmath函数或变量时，需要根据talker类型使用不同前缀：

| Talker类型 | Math前缀 | EOC前缀 | 说明 |
|-----------|---------|--------|------|
| alpha_talker | `u_` | `u_` | 主角/玩家 |
| beta_talker | `n_` | `npc_` | NPC/对话对象 |

**注意**: beta_talker的前缀在math和EOC中**不同**！
- Math中: `n_val('strength')`, `n_skill('driving')`
- EOC Effect中: `{npc_has_effect:'eff'}`, `{ npc_location_variable: { global_val: tmpPos } }`

#### 语法格式

**赋值语句(3段式) (虽然支持一段式解析但3段式能获取更好的类型提示)**:
```json
{ "math": ["变量名", "操作符", "表达式"] }
{ "math": ["u_val('strength')", "+=", "5"] }
{ "math": ["_result", "=", "u_hp_max('torso') * 2"] }
```

**布尔表达式（单参数）**:
```json
{ "math": ["u_val('strength') >= 10"] }
{ "math": ["distance('u', loc) <= 50"] }
```

#### 预定义的JMath函数 (JM命名空间)

jmath是一种CDDA的json数据的type,可自行定义

定义位置: `Schema/src/Schema/Eoc/Expression/DefineJMath.ts`

常用函数:
| 函数 | 说明 | 示例 |
|-----|------|-----|
| `u_armor(type, part)` | 获取护甲值 | `u_armor('bash', 'torso')` |
| `u_speed()` | 获取移动速度 | `u_speed() >= 100` |
| `u_health()` | 获取/设置生命值 | `u_health() -= 1` |
| `u_pain()` | 获取/设置疼痛值 | `u_pain() >= 40` |
| `u_skill(id)` | 获取/设置技能等级 | `u_skill('driving') >= 5` |
| `u_val(aspect)` | 获取/设置属性值 | `u_val('strength')` |
| `u_hp(part)` | 获取部位生命值 | `hp('torso') > 100` |
| `u_hp_max(part)` | 获取部位最大生命值 | `u_hp_max('torso')` |
| `distance(from, to)` | 计算两点距离 | `distance('u', loc)` |
| `time(str)` | 获取时间数值 | `time('now')` |
| `time_since(point)` | 获取经过时间 | `time_since(timer_var)` |
| `has_var(name)` | 判断变量是否存在 | `has_var(my_var)` |
| `has_trait(id)` | 判断是否有trait | `u_has_trait('FEEBLE')` |
| `item_count(id)` | 获取物品数量 | `u_item_count('backpack')` |

#### 预定义变量 (JMV命名空间)

定义位置: `Schema/src/Schema/Eoc/Expression/DefineJMath.ts`

通过 `u_val('变量名')` 或 `n_val('变量名')` 访问：

| 变量 | 说明 | 可赋值 |
|-----|------|-------|
| `strength` / `dexterity` / `intelligence` / `perception` | 四大属性 | ✓ |
| `focus` | 专注值 | ✓ |
| `stamina` | 耐力值 | ✓ |
| `mana` / `mana_max` | 法力值/最大法力 | ✓ / ✗ |
| `power` / `power_max` | 电力值/最大电力 | ✓ / ✗ |
| `rad` | 辐射值 | ✓ |
| `hunger` / `thirst` | 饥饿/口渴 | ✗ |
| `sleepiness` | 困倦程度 | ✓ |
| `morale` | 士气值 | ✓ |
| `cash` / `owed` / `sold` | 金钱相关 | ✓ |
| `pos_x` / `pos_y` / `pos_z` | 当前坐标 | ✓ |
| `age` / `height` | 年龄/身高 | ✓ |
| `activity_level` | 活动等级(0-5) | ✗ |

#### 数学函数

数学函数如 `pow`, `log`, `sin`, `rand` 等**不在JM命名空间**中定义。如需使用数学函数，请查阅 `游戏目录/doc/NPCs.md` 文档。

## 示例：创建简单工具物品

```typescript
import type { Item } from "@sosarciel-cdda/schema";

const myTool: Item = {
    type: "ITEM",
    id: "my_custom_tool",
    name: "My Custom Tool",
    description: "A useful tool for various tasks",
    subtypes: ["TOOL"],
    weight: "500 g",
    volume: "1 L",
    symbol: "t",
    color: "cyan",
    price: "50 USD",
    price_postapoc: "10 USD",
    material: ["steel", "plastic"],
    flags: ["WATERPROOF"]
};
```

## 输出方式

创建TypeScript对象后，询问用户需要的输出方式：

1. **单个JSON文件**: 写入指定路径
2. **多个文件**: 按内容类型拆分
3. **Mod结构**: 创建完整mod文件夹（含modinfo.json）
4. **返回代码**: 仅返回TypeScript代码供用户自行处理

## 注意事项

1. 始终从 `@sosarciel-cdda/schema` 导入类型
2. 使用正确的ID命名规范（如物品使用 `ITEM_` 前缀）
3. 参考 `Schema/src/Extract/` 中的现有ID
4. 输出前验证必填字段
5. 尽可能使用 `satisfies` 运算符以获得更好的类型推断
6. 编写完成后必须运行 `tsc --noEmit` 验证类型
