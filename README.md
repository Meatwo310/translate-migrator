# Translate Migrator

ローカライズファイル（`json` / `lang`）の差分を可視化し、既存訳を新しいソースへ安全に移植するためのブラウザツールです。Monaco Diff Editorを用いて翻訳元・翻訳先の差分を2段構成で表示し、重複キーの扱いも選択できます。

## 特徴 / Features
- `.json`と`.lang`形式に対応し、キーごとの差分をパッチ可能。
- 旧ソース（任意）を読み込むことで、変更済みキーを自動的にスキップし、最新訳を保護。
- Monaco Diff Editorベースのインタフェースで、貼り付けるだけでリアルタイムにプレビュー。
- 重複キーの処理戦略（無視・先頭・末尾・順次）を切り替え可能。

## 使い方 / Usage
1. 画面上部のセレクトで`json`または`lang`を選択します。
2. 上段エディタ左側に旧翻訳元（任意）、右側に新しい翻訳元を貼り付けます。
3. 下段エディタ左側に翻訳先を貼り付けると、右側にパッチ後の結果が自動反映されます。
4. 重複キーを含む場合は、下段右側の結果をコピーして保存してください。

## 開発環境 / Development
- **必須:** Node.js 18+ と pnpm。
- パッケージをインストール: `pnpm install`
- 開発サーバー起動: `pnpm dev`（<http://localhost:3000>）
- 型・静的解析: `pnpm lint`
- テスト実行: `pnpm test`

## プロジェクト構成 / Project Structure
- `src/app/page.tsx`: 2段のDiff Editorを持つメイン画面。ファイル形式切替やパッチ結果の反映を担います。
- `src/hooks/useStatusManager.ts`: エディタ読み込み状況を管理し、UIメッセージを制御します。
- `src/utils/jsonPatch.ts`: JSON翻訳ファイルをキー単位でパッチするユーティリティ。
- `src/utils/langPatch.ts`: `.lang`ファイルのパッチ処理とコメント保持を行うユーティリティ。

## ライセンス / License
このプロジェクトはMITライセンスで、[LICENSE.txt](LICENSE.txt)の条項に基づき提供されます。
