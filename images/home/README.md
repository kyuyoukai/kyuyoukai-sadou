# images/home

ホームページ（トップページ `index.html`）で使用する「実画像」を置くフォルダです。
「仮写真」のプレースホルダ（SVG）は `../placeholders/` にあります。

## 使い方
- ここに実画像（jpg / png / webp など）を配置し、`index.html` の
  各 `<img>` の `src` を `images/home/ファイル名` に差し替えてください。
  （例）`src="images/home/garden.jpg"`

## 参照される想定の箇所
- `index.html`
  - hero 見出し背景（現在は images/placeholders/hero.svg）
  - ご挨拶 / 講師プロフィール / お稽古ブログの各「仮写真」
    （現在は Unsplash の仮 URL）