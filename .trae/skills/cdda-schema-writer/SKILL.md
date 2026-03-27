---
name: "cdda-schema-writer"
description: "将CDDA文档转换为TypeScript类型定义。当用户需要将JSON文档转换为ts schema或提及CDDA schema转换时调用。"
---

# CDDA Schema 编写器

此 skill 用于将 CDDA (Cataclysm: Dark Days Ahead) 文档转换为遵循严格格式规范的 TypeScript 类型定义。

## 输出格式

```typescript
type {{name}}ID = CddaID<'{{NAME}}'>;
type {{name}} = {
    {{field}}: {{type}};
    ...
};
```

## 类型定义规则

1. **始终使用 `type`** - 禁止使用 `interface`
2. **数组表示法** - 始终使用 `xxx[]` 格式，禁止使用 `Array<xxx>`
3. **缩进** - 4空格
4. **JSDoc 格式** - 第一行直接跟随 `*`，不加额外空格：`/**持续时间 */`

## 类型映射规则

| 源模式 | TypeScript 类型 |
|----------------|-----------------|
| 字符串 (ID引用) | `(NameID)` |
| 字符串 (描述性文本) | `DescText` |
| 字符串 (有字面量选项) | 字面量联合类型: `"option1" \| "option2"` |
| 整数 | `Int` |
| 浮点数 | `Float` |
| 数字 (不明确) | `number` |
| 时间时长 (如 "1 s") | `(Time)` |
| 体积 | `(Volume)` |
| 重量 | `(Weight)` |
| 对象 (未指定) | `object` |
| 任意 (未指定) | `any` |
| 非TS默认类型 | 用括号包裹: `(DescText)`, `(AnyItemID)` |

## 可选字段

- 标记为"可选"或带有默认值的字段：`{{field}}?: type;`
- 禁止使用 `@optional` JSDoc 标记
- 使用 `@default` 来记录默认值

## JSDoc 文档规则

1. **保留所有原始注释** - 无论多长
2. **将 `//` 注释转换为 JSDoc 格式**
3. **使用 `@example`** 标记文档中给出的示例
4. **使用 `@default`** 标记默认值
5. **禁止臆造注释** - 如果文档没写，就留空

## 转换示例

**输入文档：**
```
weakpoint_sets    (array of strings) Weakpoint sets to apply to the monster. default "none". "zombie" Indicates the zombie's weakness. Defined in monster_weakpoints
unknow_set        (string)
volume            Volume of the creature's body, as an integer with metric units, ex. "35 L" or "1500 ml". Used to calculate monster size.
affected_by_degradation    false, // default false. If true, the item degradation value would be added to fault weight
```

**输出：**
```typescript
type Monster = {
    /**弱点集
     * 定义于 monster_weakpoints
     * @example "zombie" //表示僵尸的弱点
     * @default "none"
     */
    weakpoint_sets?: (WeakpointSetID)[];
    unknow_set: string;
    /**生物体体积, 以公制单位的整数表示
     * 用于计算怪物体型
     * @example "35 L"
     * @example "1500 ml"
     */
    volume: (Volume);
    /**是否受退化影响
     * 如果为 true, 则物品退化值将被添加到卷上的故障权重中
     * @default false
     */
    affected_by_degradation?: boolean;
};
```

## 文件输出

- 输出目录：`Schema/src/Schema/`
- 文件名：`{{name}}.ts` (PascalCase)
- 使用路径别名：`Schema/*` 和 `@src/*`

## 重要提示

1. 删除文档中无用的类型标记如 `(array of strings)`
2. 保留原始文档中的所有说明文字
3. 对于引用其他对象ID的字段，使用 `(NameID)` 格式
4. 搜索操作应限制在 `Schema/src/Schema/` 目录下
5. 目标是实现往返相等的翻译，完整保留所有注释
