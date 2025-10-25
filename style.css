body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    /* スクロールを許可 */
    margin: 0;
    padding: 20px;
    background-color: #f4f7f9; /* 明るい背景 */
    color: #333;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    min-height: auto; 
    overflow-y: auto; 
}

/* ゲーム全体を収めるコンテナ */
#setup-area, #game-area {
    width: 100%;
    max-width: 1200px; 
    margin: 0;
    padding: 20px;
    background-color: #ffffff; /* 白い背景 */
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column; 
}

/* --- 1. タイトル --- */
h1 { /* ID 'game-title'はindex.htmlにないので'h1'に修正 */
    text-align: center;
    color: #007bff;
    font-size: 2.2em;
    margin-top: 0;
    margin-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 10px;
    font-weight: 600;
}

/* --- 2. 得点版 --- */
#scoreboard {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    margin-bottom: 20px;
    border-bottom: 3px solid #007bff;
    font-size: 1.8em; 
    font-weight: bold;
    background-color: #f8f8f8;
    border-radius: 4px;
}
#current-server {
    font-size: 0.6em; 
    font-weight: normal; 
    color: #555;
    text-align: center;
}
#p1-score { color: #007bff; }
#p2-score { color: #dc3545; }


/* ------------------------------------------------------------------ */
/* --- 3. P1 / P2 情報表示 (左右並列) と ログ (その下) の配置 --- */
/* ------------------------------------------------------------------ */
/* P1とP2の情報を左右に並べるコンテナ */
#main-content-row { 
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
}

/* P1とP2の情報エリアのベーススタイル */
/* idをクラス adaptation-display-box に置き換えて汎用化 */
#p1-adaptation-display, #p2-adaptation-display {
    flex: 1; /* 左右を均等に分割 */
    min-width: 0; 
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-color: #f8f8f8;
    display: flex; 
    flex-direction: column; 
    height: auto; 
    box-sizing: border-box;
}

/* ログ (P1/P2の下に配置) */
#game-log-wrapper {
    margin-top: 10px; /* main-content-rowとの間隔を調整 */
}

#game-log {
    width: 100%; 
    padding: 15px;
    background-color: #f0f4f7;
    border: 1px solid #cce5ff;
    border-radius: 6px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    font-size: 0.9em;
    height: auto; 
    max-height: 400px; 
    overflow-y: auto; 
}
#game-log-wrapper h3 {
    margin-top: 0;
}

/* ------------------------------------------------------------------ */
/* --- P1/P2パネル内部の左右分割設定 (JSの変更に対応) --- */
/* ------------------------------------------------------------------ */

/* P1/P2の情報パネル内で、対応度と持ちサーブを左右に並べる */
/* JSで挿入される .player-content に適用 */
#p1-adaptation-display .player-content,
#p2-adaptation-display .player-content {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-grow: 1;
}

/* 左右分割エリアの均等な幅 */
.adaptation-section, .serve-list-section {
    flex: 1; 
}

/* P1/P2のパネル共通 見出し */
#p1-adaptation-display h3, #p2-adaptation-display h3 {
    text-align: center;
    font-size: 1.2em;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
}
#p1-adaptation-display h3 { color: #007bff; }
#p2-adaptation-display h3 { color: #dc3545; }

#p1-adaptation-display h4, #p2-adaptation-display h4 {
    color: #495057;
    font-size: 0.9em;
    border-bottom: 1px dashed #ddd;
    padding-bottom: 5px;
    margin-top: 5px;
    margin-bottom: 5px;
    font-weight: 600;
}

/* P2の対応度ラベルを右寄せに維持 */
#p2-adaptation-display .adaptation-section {
    text-align: right; 
}

/* P1/P2内のコンテンツの区切り */
#p1-adaptation-display .serve-list-section,
#p2-adaptation-display .serve-list-section {
    border-left: 1px solid #eee;
    padding-left: 10px;
}

.serve-list {
    list-style-type: none; 
    padding: 0;
    margin-top: 10px;
    font-size: 0.8em;
}

/* --- 適応度バーのスタイル --- */
.adapt-label {
    margin: 5px 0 0 0 !important; 
    font-size: 0.8em !important;
    font-weight: 500;
    color: #333;
}
.adapt-label.last-used {
    color: #ffc107;
    font-weight: bold;
}

.adaptation-bar {
    background-color: #e9ecef;
    border: 1px solid #dee2e6;
    height: 10px; 
    margin: 3px 0 8px 0;
    overflow: hidden;
    display: flex;
    border-radius: 5px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
}

.adaptation-fill {
    height: 100%;
    transition: width 0.3s ease-in-out;
    border-radius: 5px;
}
#p1-adaptation-display .adaptation-fill {
    background-color: #28a745; /* P1 (左) は緑 */
}
#p2-adaptation-display .adaptation-bar {
    justify-content: flex-end;
}
#p2-adaptation-display .adaptation-fill {
    background-color: #ffc107; /* P2 (右) は黄 */
}

/* --- ゲームログのメッセージスタイル --- */
.log-score { color: #007bff; font-weight: bold; padding: 5px 0; }
.log-system { color: #555; font-style: italic; padding: 3px 0; font-size: 0.9em; }

/* --- 初期設定エリアのスタイル --- */
/* 変更なし */
#player-info-container {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    background-color: #f9f9f9;
}
#player1-status, #player2-status {
    flex: 1; padding: 10px; background-color: #fff; border: 1px solid #f0f0f0; border-radius: 4px;
}
#player2-status ul, #player2-status h4 {
    text-align: right;
}
button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    padding: 10px 20px;
    transition: background-color 0.3s, transform 0.1s;
    box-shadow: 0 2px 5px rgba(0, 123, 255, 0.3);
}
button:hover {
    background-color: #0056b3;
}

/* ... (既存のスタイル) ... */

/* --- 4. 認証エリアのスタイル --- */
#auth-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 600px; /* セットアップエリアより少し小さめ */
    margin: 40px auto; 
    padding: 30px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    text-align: center;
}
#auth-area h2 {
    color: #dc3545;
    margin-bottom: 20px;
}
#auth-area button {
    background-color: #dc3545;
    box-shadow: 0 2px 5px rgba(220, 53, 69, 0.3);
}
#auth-area button:hover {
    background-color: #a71d2a;
}
