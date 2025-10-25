const SECRET_ID = "1H#j3Lk!N"; // 秘密のID

// ====================================================
// 1. データ定義 (変更なし)
// ====================================================
// ... (PLAYERS オブジェクトの定義) ...

const PLAYERS = {
    // Player 1のデフォルト
    Kibi: {
        name: "吉備",
        control: 35, 
        drive: 30, 
        push: 70, 
        adaptability: 30,
        serveMastery: [
            { name: "バックナックル", mastery: 65, spinType: 'none' },
            { name: "バック下", mastery: 30, spinType: 'backspin' },
        ],
        // AI行動プロファイルを選手ステータスに直接記述
        actionProfiles: {
            // 相手のサーブに対する行動: serve_[spinType]
            serve_backspin: { push: 60, drive: 40 }, // 下回転にはドライブ中心
            serve_topspin: { push: 60, drive: 40 },  // 上回転にはドライブ中心
            serve_none: { push: 70, drive: 30 },    // 無回転にはドライブ多め
            
            // ラリー中の行動: rally_[lastAction]
            rally_push: { shot: 5, drive: 80, push: 15 }, // 相手のツッツキにはドライブ中心
            rally_drive: { shot: 50, drive: 40, push: 10 }, // 相手のドライブはブロック(shot)中心
            rally_shot: { shot: 40, drive: 50, push: 10 } // 相手の強打もドライブで対抗
        } 
    },
    // Player 2のデフォルト
    Iimori: {
        name: "飯森",
        control: 30, 
        drive: 65, 
        push: 40, 
        adaptability: 50,
        serveMastery: [
            { name: "フォアロング", mastery: 30, spinType: 'topspin' },
            { name: "しゃがみ込み", mastery: 65, spinType: 'backspin' },
            { name: "ハイトス", mastery: 40, spinType: 'backspin' },
            { name: "ショート", mastery: 20, spinType: 'backspin' },
            { name: "下ロング", mastery: 20, spinType: 'backspin' },

        ],
        actionProfiles: {
            serve_backspin: { push: 30, drive: 70 }, 
            serve_topspin: { shot: 5, drive: 95 },  
            serve_none: { shot: 20, drive: 80 },
            
            rally_push: { shot: 10, drive: 30, push: 60 }, 
            rally_drive: { shot: 40, drive: 60, push: 0 }, 
            rally_shot: { shot: 20, drive: 75, push: 5 }
        }
    },
    // 選手の追加はここに続けて記述してください。

    Maeda: {
        name: "前田",
        control: 35, 
        drive: 55, 
        push: 35, 
        adaptability: 55,
        serveMastery: [
            { name: "フォアロング", mastery: 35, spinType: 'topspin' },
            { name: "しゃがみ込み", mastery: 40, spinType: 'backspin' },
            { name: "バック下", mastery: 25, spinType: 'backspin' },
            { name: "バックロング", mastery: 20, spinType: 'topspin' },
            { name: "フォアナックル", mastery: 15, spinType: 'none' },

        ],
        actionProfiles: {
            serve_backspin: { push: 20, drive: 70 }, 
            serve_topspin: { shot: 30, drive: 70 },  
            serve_none: { shot: 20, drive: 80 },
            
            rally_push: { shot: 5, drive: 20, push: 75 }, 
            rally_drive: { shot: 60, drive: 40, push: 0 }, 
            rally_shot: { shot: 15, drive: 80, push: 5 }
        }
    }

};


// ====================================================
// 2. ゲーム状態 (変更なし)
// ====================================================

let player1 = {};
let player2 = {};
let currentServer = 1;
let serveCount = 0; 
let isRallying = false;
let gameInterval;
const GAME_SPEED_MS = 1000; 

let ballState = {
    spin: 'none', 
    speed: 50,
    target: 2,
    lastAction: 'none',
    lastServeType: null, 
    pointReason: 'ラリー中'
};

// ====================================================
// 3. UI表示関数 (updateAdaptationDisplay を修正)
// ====================================================

function setupPlayerSelection() {
    const p1Select = document.getElementById('player1-preset');
    const p2Select = document.getElementById('player2-preset');
    
    p1Select.innerHTML = '';
    p2Select.innerHTML = '';

    for (const key in PLAYERS) {
        const player = PLAYERS[key];
        // プリセットキー (${key}) の表示を削除
        const option = `<option value="${key}">${player.name}</option>`; 
        p1Select.innerHTML += option;
        p2Select.innerHTML += option;
    }
    
    const keys = Object.keys(PLAYERS);
    if (keys.length >= 2) {
        p1Select.value = keys[0];
        p2Select.value = keys[1];
    } else if (keys.length === 1) {
        p1Select.value = keys[0];
        p2Select.value = keys[0];
    }
    
    displayStatus('player1-status', p1Select.value);
    displayStatus('player2-status', p2Select.value);
}


function displayStatus(elementId, presetKey) {
    const preset = PLAYERS[presetKey];
    
    const serveList = preset.serveMastery.map(s => {
        return `<li>${s.name} (${s.spinType === 'none' ? '無' : s.spinType === 'topspin' ? '上' : '下'}回転, 習熟度:${s.mastery})</li>`;
    }).join('');

    const el = document.getElementById(elementId);
    el.innerHTML = `
        <ul>
            <li>選手名: ${preset.name}</li>
            <li>コントロール: ${preset.control}</li>
            <li>ドライブ: ${preset.drive}</li>
            <li>ツッツキ: ${preset.push}</li>
            <li>対応力: ${preset.adaptability}</li>
        </ul>
        <h4>サーブ一覧:</h4>
        <ul style="list-style-type: none; padding-left: 10px;">
            ${serveList}
        </ul>
    `;
}

function updateScoreboard() {
    const p1Name = player1.name || 'P1';
    const p2Name = player2.name || 'P2';
    
    document.getElementById('p1-score').textContent = `${p1Name}: ${player1.score}`;
    document.getElementById('p2-score').textContent = `${p2Name}: ${player2.score}`;
    
    document.getElementById('current-server').textContent = `サーブ: ${currentServer === 1 ? p1Name : p2Name} (残り${2 - (serveCount % 2)}球)`;
}

function updateAdaptationDisplay() {
    const p1AdaptEl = document.getElementById('p1-adaptation-display');
    const p2AdaptEl = document.getElementById('p2-adaptation-display');

    // バーを生成するヘルパー関数
    const createAdaptBar = (player, opponent, serveIndex) => {
        const serve = opponent.serveMastery[serveIndex];
        const currentServeName = serve.name;
        const value = player.opponentAdaptation[serveIndex]; 
        const max = 100;
        const percent = Math.min(100, (value / max) * 100);
        
        const isLast = ballState.lastServeType === serveIndex;
        const className = isLast ? ' last-used' : ''; 
        const spinText = serve.spinType === 'none' ? '無' : serve.spinType === 'topspin' ? '上' : '下';

        // NOTE: HTML構造を左右分割のために変更
        return `
            <p class="adapt-label${className}">${currentServeName} (${spinText}回転) **対応度: ${Math.round(value)}** ${isLast ? '★' : ''}</p>
            <div class="adaptation-bar"><div class="adaptation-fill" style="width: ${percent}%;"></div></div>
        `;
    };

    // P1コンテンツ生成 (P2のサーブへの対応度を表示)
    const p1AdaptContent = player2.serveMastery.map((s, index) => createAdaptBar(player1, player2, index)).join('');
    // P1の持ちサーブリスト
    const p1ServeList = player1.serveMastery.map(s => `<li>${s.name} (習熟度:${s.mastery})</li>`).join('');
    
    // P1パネルのHTML構造を生成 (左右分割のためのクラスを適用)
    p1AdaptEl.innerHTML = `
        <h3 class="p1-color">${player1.name} (P1)</h3>
        <div class="player-content">
            <div class="adaptation-section">
                <h4>対応度 (相手サーブ):</h4>
                ${p1AdaptContent}
            </div>
            <div class="serve-list-section">
                <h4>持ちサーブ:</h4>
                <ul class="serve-list">${p1ServeList}</ul>
            </div>
        </div>
    `;

    // P2コンテンツ生成 (P1のサーブへの対応度を表示)
    const p2AdaptContent = player1.serveMastery.map((s, index) => createAdaptBar(player2, player1, index)).join('');
    // P2の持ちサーブリスト
    const p2ServeList = player2.serveMastery.map(s => `<li>${s.name} (習熟度:${s.mastery})</li>`).join('');
    
    // P2パネルのHTML構造を生成 (左右分割のためのクラスを適用)
    p2AdaptEl.innerHTML = `
        <h3 class="p2-color">${player2.name} (P2)</h3>
        <div class="player-content">
            <div class="adaptation-section">
                <h4>対応度 (相手サーブ):</h4>
                ${p2AdaptContent}
            </div>
            <div class="serve-list-section">
                <h4>持ちサーブ:</h4>
                <ul class="serve-list">${p2ServeList}</ul>
            </div>
        </div>
    `;
}

function logGame(message, type = '') {
    const log = document.getElementById('game-log');
    if (type === 'score' || type === 'system') {
        log.innerHTML = `<div class="log-${type}">${message}</div>` + log.innerHTML;
    }
}

function moveBall(serverID) {
    // UI非表示のため何もしません
}


// ====================================================
// 3.5. 認証関数 (★★★★ 追加 ★★★★)
// ====================================================

function authenticateId() {
    const inputId = document.getElementById('access-id').value;
    const authArea = document.getElementById('auth-area');
    const setupArea = document.getElementById('setup-area');
    const authMessage = document.getElementById('auth-message');

    if (inputId === SECRET_ID) {
        // 認証成功
        authArea.style.display = 'none';
        setupArea.style.display = 'flex'; // setup-area を表示 (CSSのflex-direction: column に合わせる)
        authMessage.textContent = '認証に成功しました。';
        // setupPlayerSelection は window.onload で既に呼ばれているため不要
    } else {
        // 認証失敗
        authMessage.textContent = 'エラー: IDが間違っています。';
        document.getElementById('access-id').value = '';
    }
}

// ====================================================
// 4. ゲーム制御関数 (変更なし)
// ====================================================

function startGame() {
    const p1PresetKey = document.getElementById('player1-preset').value;
    const p2PresetKey = document.getElementById('player2-preset').value;

    // 選手のステータスと行動プロファイルをディープコピー
    player1 = JSON.parse(JSON.stringify(PLAYERS[p1PresetKey]));
    player2 = JSON.parse(JSON.stringify(PLAYERS[p2PresetKey]));
    
    // スコア、適応度を初期化
    player1.score = 0;
    player2.score = 0;
    
    // 適応度はserveMastery配列のインデックスをキーとして持つように初期化
    // actionProfilesは既にコピーされているため、別途紐づけ不要
    player1.opponentAdaptation = player2.serveMastery.map(() => 0);
    player2.opponentAdaptation = player1.serveMastery.map(() => 0);


    currentServer = 1;
    serveCount = 0; 
    isRallying = false;
    ballState.lastAction = 'none';
    ballState.lastServeType = null; 
    ballState.pointReason = 'ラリー中'; 
    
    document.getElementById('setup-area').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    updateScoreboard();
    updateAdaptationDisplay();

    clearInterval(gameInterval);
    logGame(`[${player1.score} - ${player2.score}] 試合開始！${player1.name}がサーブ権を持ちます。`, 'system');
    gameInterval = setInterval(handleGameTurn, GAME_SPEED_MS);
}

function handleGameTurn() {
    // 勝利判定
    if (player1.score >= 11 || player2.score >= 11) {
        if (Math.abs(player1.score - player2.score) >= 2) {
            clearInterval(gameInterval);
            const winner = (player1.score > player2.score) ? player1.name : player2.name;
            logGame(`ゲームセット！**${winner}**の勝利です！`, 'score');
            return;
        }
    }

    if (!isRallying) {
        const serverID = currentServer;
        const serverAI = (serverID === 1) ? player1 : player2;
        AI_serveDecision(serverID, serverAI);
    } else {
        const receiverID = ballState.target;
        const receiverAI = (receiverID === 1) ? player1 : player2;
        AI_rallyDecision(receiverID, receiverAI); 
    }
}

function scorePoint(winnerID, reason) {
    const winner = (winnerID === 1) ? player1 : player2;
    const loser = (winnerID === 1) ? player2 : player1;

    winner.score++;
    isRallying = false;
    serveCount++; 

    logGame(`[${player1.score} - ${player2.score}] **${winner.name}**が得点！ ${reason}`, 'score');

    if (serveCount % 2 === 0) {
        if (player1.score < 10 || player2.score < 10) {
             currentServer = (currentServer === 1) ? 2 : 1;
             const nextServerName = currentServer === 1 ? player1.name : player2.name;
             logGame(`[${player1.score} - ${player2.score}] サーブ権が${nextServerName}に移動しました。`, 'system');
        } else {
            currentServer = (currentServer === 1) ? 2 : 1;
            const nextServerName = currentServer === 1 ? player1.name : player2.name;
            logGame(`[${player1.score} - ${player2.score}] デュース。サーブ権が${nextServerName}に移動しました。`, 'system');
            serveCount = 1; 
        }
    }

    const receiverAI = (3 - currentServer === 1) ? player1 : player2;
    if (ballState.lastServeType !== null) {
        const lastIndex = ballState.lastServeType;
        
        // 修正されたロジック: 使われなかったサーブの対応度を微減 (3ポイント減)
        receiverAI.opponentAdaptation.forEach((adapt, index) => {
            if (index !== lastIndex) {
                receiverAI.opponentAdaptation[index] = Math.max(0, adapt - 3);
            }
        });
    }

    ballState.lastAction = 'none';
    ballState.lastServeType = null;
    ballState.pointReason = 'ラリー中';
    updateScoreboard();
    updateAdaptationDisplay();
}

window.onload = () => {
    setupPlayerSelection(); 
};

// ====================================================
// 5. AIロジック 
// ====================================================

function selectActionByProbability(actionProbabilities) {
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;
    
    for (const action in actionProbabilities) {
        cumulativeProbability += actionProbabilities[action];
        if (rand < cumulativeProbability) {
            return action;
        }
    }
    return Object.keys(actionProbabilities)[0];
}

function AI_serveDecision(serverID, serverAI) {
    const receiverAI = (serverID === 1) ? player2 : player1;
    let bestServeIndex = 0;
    let maxEffectiveness = -Infinity;
    const lastServeIndex = ballState.lastServeType;

    serverAI.serveMastery.forEach((serve, index) => {
        let effectiveness = serve.mastery * 1.5; 
        
        if (index !== lastServeIndex && lastServeIndex !== null) {
            effectiveness += 30; 
        }

        effectiveness -= receiverAI.opponentAdaptation[index] * 2.5;
        
        effectiveness += (Math.random() * 15); 

        if (effectiveness > maxEffectiveness) {
            maxEffectiveness = effectiveness;
            bestServeIndex = index;
        }
    });

    serveAction(bestServeIndex, serverID);
}

function serveAction(serveIndex, serverID) {
    const receiverID = 3 - serverID;
    const receiverAI = (serverID === 1) ? player2 : player1;
    const serverAI = (serverID === 1) ? player1 : player2;
    
    const serve = serverAI.serveMastery[serveIndex];
    const mastery = serve.mastery;
    const currentAdapt = receiverAI.opponentAdaptation[serveIndex];
    
    const missChance = Math.sqrt(Math.max(0, 100 - mastery));
    
    if (Math.random() * 100 < missChance) {
        scorePoint(receiverID, 'サーブミスによる'); 
        return;
    }
    
    isRallying = true;
    
    ballState.spin = serve.spinType; 
    ballState.speed = mastery + Math.random() * 10;
    ballState.target = receiverID;
    ballState.lastServeType = serveIndex; 
    moveBall(serverID);

    const successChance = 40 + (currentAdapt / 100) * 59; 
    
    const baseAdapt = receiverAI.adaptability;
    const adaptationBoost = (baseAdapt / Math.max(1, mastery)) * 10 * 2; 

    if (Math.random() * 100 < successChance) {
        
        // 成功した場合: 満額ブースト
        receiverAI.opponentAdaptation[serveIndex] = Math.min(100, currentAdapt + adaptationBoost);
        updateAdaptationDisplay();
        
        const actionKey = `serve_${serve.spinType}`;
        const chosenAction = selectActionByProbability(receiverAI.actionProfiles[actionKey]);
        
        rallyAction(chosenAction, receiverID, receiverAI, true); 
        
    } else {
         // 返球できなかった場合: 対応度ブーストを1.2倍に設定 (以前は0.5倍)
        receiverAI.opponentAdaptation[serveIndex] = Math.min(100, currentAdapt + adaptationBoost * 1.2);
        updateAdaptationDisplay();

        scorePoint(serverID, `${receiverAI.name}が${serve.name}サーブを返球できなかったため`);
    }
}

function AI_rallyDecision(playerID, playerAI) {
    const opponentID = 3 - playerID;
    const incomingSpin = ballState.spin;
    const lastAction = ballState.lastAction;

    const baseMiss = 100 - playerAI.control;
    const missChance = Math.max(5, baseMiss * 0.5); 
    
    if (Math.random() * 100 < missChance) {
        scorePoint(opponentID, '返球前のミスによる');
        return;
    }
    
    let actionKey;
    if (lastAction === 'push') {
        actionKey = 'rally_push';
    } else if (lastAction === 'drive') {
        actionKey = 'rally_drive';
    } else if (lastAction === 'shot') {
        actionKey = 'rally_shot';
    } else {
        actionKey = 'rally_push'; 
    }
    
    const chosenAction = selectActionByProbability(playerAI.actionProfiles[actionKey]);
    
    rallyAction(chosenAction, playerID, playerAI, false); 
}

function rallyAction(actionType, playerID, playerAI, isServeReturn) {
    const opponentID = 3 - playerID;
    const successRate = calculateActionSuccessRate(actionType, playerAI, ballState.spin, ballState.lastAction);

    if (Math.random() * 100 < successRate) {
        
        if (actionType === 'drive') {
            ballState.spin = 'topspin';
            ballState.speed = 60 + playerAI.drive * 0.7 + Math.random() * 10;
        } else if (actionType === 'shot') { 
            ballState.spin = 'none'; 
            ballState.speed = 70 + playerAI.control * 0.5 + Math.random() * 15;
        } else { // 'push' (ツッツキ)
            ballState.spin = 'backspin';
            ballState.speed = 30 + playerAI.push * 0.5 + Math.random() * 5;
        }
        
        ballState.target = opponentID;
        ballState.lastAction = actionType;
        ballState.pointReason = `相手の${actionType}を返せなかったため`;
        moveBall(playerID);
        
    } else {
        scorePoint(opponentID, isServeReturn ? `${playerAI.name}のサーブ対応後の${actionType}ミスによる` : `${playerAI.name}の${actionType}ミスによる`);
    }
}


function calculateActionSuccessRate(actionType, playerAI, incomingSpin, lastAction) {
    let baseRate;

    if (actionType === 'shot') {
        baseRate = (playerAI.control * 1.0 + 50) / 2;
    } else if (actionType === 'drive') {
        baseRate = (playerAI.drive * 1.5 + playerAI.control * 0.5) / 2;
    } else { 
        baseRate = (playerAI.push * 1.5 + playerAI.control * 0.5) / 2;
    }

    if (incomingSpin === 'backspin') {
        if (actionType === 'drive') baseRate *= 1.2;
        if (actionType === 'push') baseRate *= 0.8;
    } else if (incomingSpin === 'topspin') {
        if (actionType === 'drive') baseRate *= 0.9;
        if (actionType === 'push') baseRate *= 1.1;
    } else if (incomingSpin === 'none') { 
        if (actionType === 'drive') baseRate *= 0.95;
        if (actionType === 'push') baseRate *= 0.95;
    }


    if (lastAction === 'shot') {
        if (actionType === 'drive') baseRate *= 1.3; 
        if (actionType === 'push') baseRate *= 0.9;
    } else if (lastAction === 'push' || lastAction === 'serve') { 
        if (actionType === 'shot') baseRate *= 0.7;
        if (actionType === 'drive') baseRate *= 1.1;
    } else if (lastAction === 'drive') { 
         if (actionType === 'drive') baseRate *= 0.9;
         if (actionType === 'push') baseRate *= 0.8;
         if (actionType === 'shot') baseRate *= 1.1; 
    }
    
    const controlPenalty = (100 - playerAI.control) * 0.3;
    
    return Math.min(95, baseRate - controlPenalty);
}


// 初期設定の呼び出し
window.onload = () => {
    setupPlayerSelection(); 
};
