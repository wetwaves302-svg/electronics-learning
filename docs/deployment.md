# 部署與維護說明

## 架構
- `app/`:學生與教師看到的網站(React + TypeScript + Vite)。可以單獨使用(不登入,紀錄存在瀏覽器)。
- `server/`:Node 伺服器 + SQLite 資料庫(`server/data/electronics.db`)。負責帳號、紀錄同步、教師後台、Excel 匯出,並直接提供 `app/dist` 的網站,所以只要開一個服務。
- 需要 Node.js 24 以上(使用內建的 `node:sqlite`)。

## 第一次安裝
```bash
cd app && npm install && npm run build      # 建置網站
cd ../server && npm install                 # 安裝伺服器套件
npm run create-teacher -- <帳號> <密碼至少8字> <姓名>   # 建立教師帳號
npm start                                   # 啟動,預設 http://localhost:8787
```
可用 `--port 8080`、`--db /路徑/electronics.db` 指定埠與資料庫位置(或環境變數 `PORT`、`DB_PATH`)。

## 使用流程
1. 教師登入 → 建立班級 → 取得「班級代碼」。
2. 學生用班級代碼自己註冊,或教師在「學生」分頁批次建立帳號(初始密碼只顯示一次,請抄下)。
3. 學生登入後,練習、遊戲、教學檢核的紀錄自動同步;沒有網路時先存在裝置,連線後補傳。
4. 教師看「總覽、學生、題目分析、指定練習」,需要時匯出 Excel。

## 資料備份(重要)
所有資料都在 `server/data/electronics.db`。定期複製這個檔案即可備份(建議在伺服器停止時複製,或使用 `sqlite3 electronics.db ".backup backup.db"`)。還原就是把檔案放回原位。

## 對外開放(學生在家使用)
伺服器本身不含 HTTPS。若要讓校外使用,請放在有 HTTPS 的環境:
- 學校或自己的主機:前面放 Caddy 或 Nginx 反向代理並設定憑證。
- 雲端主機(例如 Render、Fly.io、Railway 等能執行 Node 並保留磁碟的服務):把 `server/data` 放在永久磁碟上,啟動指令 `npm start`。
沒有 HTTPS 時,密碼會以明文在網路上傳送,不建議對校外開放。

## 帳號與安全
- 密碼以 scrypt + 隨機鹽雜湊儲存;登入失敗 8 次會暫時鎖定 10 分鐘。
- 教師只能看自己班級;學生只能看自己的紀錄。
- 忘記密碼:教師在「學生」分頁按「重設密碼」。教師本人忘記密碼,請在伺服器上重建帳號或以 SQLite 工具處理。

## 新增或修改題目
- 教師後台「題目審核與編輯」可修改題幹、解析、審核狀態,並保留版本紀錄(原始內容永遠保留為版本 0);也可新增選擇題與數值題。
- 大量或需要圖與教練的題目:修改 `app/src/data/questions/`、`app/src/data/coach/`,並執行測試(下方)。

## 測試
```bash
cd app && npx vitest run      # 計算核心、題庫完整性、教練與遊戲內容
cd server && npm test         # 帳號、權限、同步、分析、匯出
```
題庫測試會檢查:範圍內 49 題都有教練、答案與習作原書一致、數值可由計算核心重算。**題目與解析目前最高只到「我方計算已驗證」,尚未經專業教師審核。**
