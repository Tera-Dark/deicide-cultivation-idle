# TapTap 上架物料

除 `cover-16x9.jpg` 外，本目录文件不参与游戏包体构建，仅用于开发者中心上传。

| 文件 | TapTap 后台字段 | 规格 | 状态 |
| --- | --- | --- | --- |
| `icon-1x1.jpg` | 游戏图标 | 1024×1024，1:1，JPG | 已去圆角，满幅方形 |
| `cover-16x9.jpg` | 横版宣传图 | 1920×1080，JPG，<2MB | 含游戏名，无其他文字 |
| `promo-square-1440.jpg` | 方形宣传图 | 1440×1440，JPG，<2MB | 含游戏名，无其他文字 |
| `poster-3x4.jpg` | 竖版推荐卡 / 专题封面 | 896×1200（3:4），JPG | 含游戏名 |
| `screenshots/screenshot-01-arena.png` | 实机截图 | 1290×2796，PNG，<2MB | 战区 / 古神 / 构筑 |
| `screenshots/screenshot-02-mercs.png` | 实机截图 | 1290×2796，PNG，<2MB | 五人护法 / 词缀 |
| `screenshots/screenshot-03-relics.png` | 实机截图 | 1290×2796，PNG，<2MB | 古神遗物 |
| `screenshots/screenshot-04-compendium.png` | 实机截图 | 1290×2796，PNG，<2MB | 万劫秘藏图鉴 |
| `video/gameplay-9x16.mp4` | 实机录屏 | 720×1280，9:16，H.264，17.3s，1.2MB | 无手机 UI / 无水印 |

## 仍需运营主体补齐

- 隐私政策 / 用户协议中的 `【运营主体】`、`【联系邮箱】`、`【注册地址】`、`【争议解决地】`。
- 软件著作权（原始取得）、小游戏前置备案、ICP 备案。
- TapTap 开发者中心创建的小游戏 App ID、TapTap 登录配置、Dirichlet 广告位 ID。
- 正式包构建：`bun run build:minigame`，将 `dist-minigame/` 用 TapTap 打包工具打成 zip 后上传。

## 广告位环境变量

复制 `.env.minigame` 并填入：

```
VITE_TAPTAP_REWARDED_AD_UNIT_ID=...
VITE_TAPTAP_INTERSTITIAL_AD_UNIT_ID=...
```

未配置广告位时，正式包不会展示任何广告入口，也不会发放广告奖励。
