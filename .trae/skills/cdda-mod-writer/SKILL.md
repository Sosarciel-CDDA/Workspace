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

## 示例：创建怪物

```typescript
import type { Monster } from "@sosarciel-cdda/schema";

const myMonster: Monster = {
    type: "MONSTER",
    id: "my_custom_monster",
    name: "Custom Creature",
    description: "A strange creature",
    species: "ZOMBIE",
    diff: 5,
    bodytype: "human",
    weight: 80000,
    volume: 62500,
    hp: 100,
    speed: 80,
    attack_cost: 100,
    morale: 50,
    armor_bash: 4,
    armor_cut: 2,
    vision_day: 40,
    vision_night: 3,
    symbol: "M",
    color: "red"
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
