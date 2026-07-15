# 规则配置

CS2 Inventory Simulator 支持通过规则在运行时配置应用行为。所有规则存储在数据库 `Rule` 表中，可通过管理员 API 或直接操作数据库修改。

> 所有可用的物品及属性见 [items.json](https://raw.githubusercontent.com/ianlucas/cs2-lib/refs/heads/main/scripts/data/items.json)。

---

## App（应用）

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `appName` | string | 空 | 应用名称 |
| `appFooterName` | string | 空 | 页脚名称 |
| `appLogoUrl` | string | 空 | Logo URL（需重启） |
| `appFaviconUrl` | string | 空 | Favicon URL |
| `appFaviconMimeType` | string | 空 | Favicon MIME 类型 |
| `appSeoDescription` | string | 空 | SEO 描述 |
| `appSeoImageUrl` | string | 空 | SEO 图片 |
| `appSeoTitle` | string | 空 | SEO 标题 |
| `appCountry` | string | `us` | 国家代码（ISO-3166-1 alpha-2） |
| `appCacheInventory` | boolean | `true` | 离线/未登录时缓存用户库存 |
| `appHideLogo` | boolean | `false` | 隐藏 Logo |
| `appHideAuth` | boolean | `false` | 隐藏认证控件 |

## Steam（认证）

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `steamApiKey` | string | 环境变量 `STEAM_API_KEY` | Steam API 密钥，用于获取用户信息 |
| `steamCallbackUrl` | string | 环境变量 `STEAM_CALLBACK_URL` | Steam 认证回调 URL |

> ⚠️ **注意：** 在桌面端纯 API 架构下，`steamCallbackUrl` 已废弃。Steam 认证在桌面端直接完成，服务器不参与回调。

## Inventory（库存）

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `inventoryMaxItems` | number | `256` | 用户库存最大物品数 |
| `inventoryStorageUnitMaxItems` | number | `32` | 收纳盒最大容量 |
| `inventoryInactivityResetDays` | number | `0` | 超过 N 天未登录自动清空库存（0=禁用） |

## Inventory Items（物品）

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `inventoryItemAllowEdit` | boolean | `true` | 允许编辑物品 |
| `inventoryItemAllowApplySticker` | boolean | `true` | 允许应用贴纸 |
| `inventoryItemAllowScrapeSticker` | boolean | `true` | 允许刮除贴纸 |
| `inventoryItemAllowRemoveSticker` | boolean | `true` | 允许移除贴纸 |
| `inventoryItemAllowApplyPatch` | boolean | `true` | 允许应用印花 |
| `inventoryItemAllowRemovePatch` | boolean | `true` | 允许移除印花 |
| `inventoryItemAllowUnlockContainer` | boolean | `true` | 允许开箱 |
| `inventoryItemAllowInspectInGame` | boolean | `true` | 允许游戏内检视 |
| `inventoryItemAllowShare` | boolean | `true` | 允许分享物品 |
| `inventoryItemEquipHideModel` | string-array | 空 | 禁止装备指定模型（例: `knife_flip;bayonet`） |
| `inventoryItemEquipHideType` | string-array | 空 | 禁止装备指定类型（例: `agent;weapon`） |

## Craft（合成）

### 可见性

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `craftHideCategory` | string-array | 空 | 隐藏合成分类（例: `secondary;rifle`） |
| `craftHideType` | string-array | 空 | 隐藏合成类型（例: `agent;case`） |
| `craftHideFilterType` | string-array | 空 | 隐藏合成筛选类型（例: `sticker`） |
| `craftHideModel` | string-array | 空 | 隐藏合成模型（例: `knife_flip;bayonet`） |
| `craftHideId` | number-array | 空 | 隐藏合成物品 ID（例: `307`） |

### 功能开关

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `craftMaxQuantity` | number | `0` | 单次合成最大数量（0=无限制） |
| `craftAllowNametag` | boolean | `true` | 允许自定义命名标签 |
| `craftAllowSeed` | boolean | `true` | 允许自定义种子 |
| `craftAllowStatTrak` | boolean | `true` | 允许 StatTrak |
| `craftAllowWear` | boolean | `true` | 允许自定义磨损 |
| `craftAllowStickers` | boolean | `true` | 允许贴纸设置 |
| `craftAllowStickerRotation` | boolean | `true` | 允许贴纸旋转 |
| `craftAllowStickerWear` | boolean | `true` | 允许贴纸磨损 |
| `craftAllowStickerX` | boolean | `true` | 允许贴纸 X 偏移 |
| `craftAllowStickerY` | boolean | `true` | 允许贴纸 Y 偏移 |
| `craftAllowStickerSchema` | boolean | `true` | 允许贴纸布局 |
| `craftAllowPatches` | boolean | `true` | 允许印花设置 |
| `craftAllowKeychains` | boolean | `true` | 允许钥匙扣设置 |
| `craftAllowKeychainSeed` | boolean | `true` | 允许钥匙扣种子 |
| `craftAllowKeychainX` | boolean | `true` | 允许钥匙扣 X 偏移 |
| `craftAllowKeychainY` | boolean | `true` | 允许钥匙扣 Y 偏移 |
| `craftAllowKeychainZ` | boolean | `true` | 允许钥匙扣 Z 偏移 |
| `craftAllowImportInspectLink` | boolean | `true` | 允许从检视链接导入 |

## Edit（编辑）

### 可见性

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `editHideCategory` | string-array | 空 | 隐藏编辑分类（例: `secondary;rifle`） |
| `editHideType` | string-array | 空 | 隐藏编辑类型（例: `sticker;weapon`） |
| `editHideModel` | string-array | 空 | 隐藏编辑模型（例: `knife_flip;bayonet`） |
| `editHideId` | number-array | 空 | 隐藏编辑物品 ID（例: `307`） |

### 功能开关

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `editAllowNametag` | boolean | `true` | 允许命名标签 |
| `editAllowSeed` | boolean | `true` | 允许种子 |
| `editAllowStatTrak` | boolean | `true` | 允许 StatTrak |
| `editAllowWear` | boolean | `true` | 允许磨损 |
| `editAllowStickers` | boolean | `true` | 允许贴纸编辑 |
| `editAllowStickerRotation` | boolean | `true` | 允许贴纸旋转 |
| `editAllowStickerWear` | boolean | `true` | 允许贴纸磨损 |
| `editAllowStickerX` | boolean | `true` | 允许贴纸 X 偏移 |
| `editAllowStickerY` | boolean | `true` | 允许贴纸 Y 偏移 |
| `editAllowStickerSchema` | boolean | `true` | 允许贴纸布局 |
| `editAllowPatches` | boolean | `true` | 允许印花编辑 |
| `editAllowKeychains` | boolean | `true` | 允许钥匙扣编辑 |
| `editAllowKeychainSeed` | boolean | `true` | 允许钥匙扣种子 |
| `editAllowKeychainX` | boolean | `true` | 允许钥匙扣 X 偏移 |
| `editAllowKeychainY` | boolean | `true` | 允许钥匙扣 Y 偏移 |
| `editAllowKeychainZ` | boolean | `true` | 允许钥匙扣 Z 偏移 |

## CSFloat

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `csFloatUrl` | string | 空 | CSFloat API URL |
| `csFloatHeaders` | string-array | 空 | CSFloat 请求头（例: `Authorization;Bearer MyAPIToken`） |

## Viewer（3D 查看器）

| 规则 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `viewerEnabled` | boolean | `false` | 启用 3D 查看器 |
| `viewerAttachmentsOnly` | boolean | `false` | 仅 3D 查看器用于附件功能（贴纸/钥匙扣） |
| `viewerKey` | string | 环境变量 `VIEWER_KEY` | 3D 查看器合作伙伴密钥 |

---

## 规则覆盖

规则支持按用户或用户组覆盖：

1. **`UserRule`** — 为特定用户设置规则
2. **`GroupRule`** — 为用户组设置规则（需先创建 `Group`，再通过 `UserGroup` 关联用户）
3. 用户同时属于多个组时，`priority` 较高的组规则生效

> 例：用户同时属于 `admin` 和 `vip` 组，应确保 `admin` 组的 `priority` 高于 `vip` 组。
