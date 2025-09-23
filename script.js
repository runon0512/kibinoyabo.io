// ******************************************************
// シミュレーション状態管理
// ******************************************************
let currentRound = 0;
let currentDrivers = [];
let raceWinners = [];
window.allRaceResults = []; // 詳細表示用

// ******************************************************
// マシンパフォーマンスレート (Attack/Pace/Compatibilityに分割)
// ******************************************************
const TEAM_RATES = {
    // team: { attack_rate: 予選, pace_rate: 決勝, compatibility: コース相性 (0: 低速, 100: 高速) }
    "Red Bull": { attack_rate: 87, pace_rate: 89, compatibility: 65 },
    "Ferrari": { attack_rate: 92, pace: 88, compatibility: 30 },
    "McLaren": { attack_rate: 94, pace_rate: 96, compatibility: 85 },
    "Mercedes": { attack_rate: 89, pace_rate: 89, compatibility: 50 },
    "Williams": { attack_rate: 82, pace_rate: 84, compatibility: 75 },
    "Aston Martin": { attack_rate: 83, pace_rate: 81, compatibility: 40 },
    "Alpine": { attack_rate: 76, pace_rate: 78, compatibility: 55 },
    "Racing Bulls": { attack_rate: 81, pace_rate: 83, compatibility: 60 },
    "Kick Sauber": { attack_rate: 80, pace_rate: 78, compatibility: 20 },
    "Haas": { attack_rate: 81, pace_rate: 81, compatibility: 45 },
};

// 全チームのカラー定義
const TEAM_COLORS = {
    "Red Bull": '#0600EF',       
    "Ferrari": '#DC0000',        
    "McLaren": '#FF8700',        
    "Mercedes": '#00D2BE',       
    "Williams": '#005AFF',       
    "Aston Martin": '#006F62',   
    "Alpine": '#0090FF',         
    "Racing Bulls": '#4A64EB',   
    "Kick Sauber": '#52E41C',    
    "Haas": '#B6B6B6',           
};

// ドライバープール (Attack, Pace, Stability)
const DRIVER_POOL = {
    // 選手名: { attack(予選), pace(決勝), stability(安定性), team }
    "Max Verstappen": { attack: 96, pace: 95, stability: 97, team: "Red Bull" }, 
    "Yuki Tsunoda": { attack: 85, pace: 83, stability: 88, team: "Red Bull" },
    "Charles Leclerc": { attack: 94, pace: 90, stability: 89, team: "Ferrari" },
    "Lewis Hamilton": { attack: 90, pace: 92, stability: 95, team: "Ferrari" },
    "Lando Norris": { attack: 91, pace: 93, stability: 90, team: "McLaren" },
    "Oscar Piastri": { attack: 88, pace: 89, stability: 86, team: "McLaren" },
    "George Russell": { attack: 93, pace: 91, stability: 88, team: "Mercedes" },
    "A. Kimi Antonelli": { attack: 82, pace: 78, stability: 75, team: "Mercedes" },
    "Fernando Alonso": { attack: 85, pace: 89, stability: 93, team: "Aston Martin" },
    "Lance Stroll": { attack: 76, pace: 74, stability: 70, team: "Aston Martin" },
    "Pierre Gasly": { attack: 83, pace: 81, stability: 82, team: "Alpine" },
    "Jack Doohan": { attack: 73, pace: 75, stability: 76, team: "Alpine" },
    "Alex Albon": { attack: 85, pace: 83, stability: 84, team: "Williams" },
    "Carlos Sainz": { attack: 87, pace: 88, stability: 91, team: "Williams" },
    "Liam Lawson": { attack: 80, pace: 80, stability: 85, team: "Racing Bulls" },
    "Isack Hadjar": { attack: 79, pace: 80, stability: 75, team: "Racing Bulls" },
    "Nico Hulkenberg": { attack: 78, pace: 77, stability: 83, team: "Kick Sauber" },
    "Gabriel Bortoleto": { attack: 77, pace: 78, stability: 72, team: "Kick Sauber" },
    "Esteban Ocon": { attack: 79, pace: 77, stability: 81, team: "Haas" },
    "Oliver Bearman": { attack: 75, pace: 76, stability: 74, team: "Haas" },
};

// ポイントシステム (上位10名のみ)
const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// メンタリティ変動テーブル
const MENTALITY_CHANGE_BY_POS = {
    1: 30, 2: 15, 3: 10, 4: 8, 5: 6,
    6: 4, 7: 3, 8: 2, 9: 1, 10: 1,
    11: 0, 12: -1, 13: -2, 14: -3, 15: -5,
    16: -7, 17: -10, 18: -15, 19: -20, 20: -30
};

const DNF_MENTALITY_PENALTY = -50;
const TEAMMATE_WIN_MENTALITY = 10;
const TEAMMATE_LOSE_MENTALITY = -10;

// ******************************************************
// 24戦のサーキットカレンダー (0: 低速, 100: 高速)
// ******************************************************
const RACE_CALENDAR = [
    { name: "バーレーンGP", track_value: 60 }, { name: "サウジアラビアGP", track_value: 90 },
    { name: "オーストラリアGP", track_value: 55 }, { name: "日本GP", track_value: 75 },
    { name: "中国GP", track_value: 50 }, { name: "マイアミGP", track_value: 45 },
    { name: "エミリア・ロマーニャGP", track_value: 35 }, { name: "モナコGP", track_value: 5 }, 
    { name: "カナダGP", track_value: 40 }, { name: "スペインGP", track_value: 55 },
    { name: "オーストリアGP", track_value: 65 }, { name: "イギリスGP", track_value: 80 },
    { name: "ハンガリーGP", track_value: 20 }, { name: "ベルギーGP", track_value: 95 }, 
    { name: "オランダGP", track_value: 30 }, { name: "モンツァGP", track_value: 100 }, 
    { name: "アゼルバイジャンGP", track_value: 70 }, { name: "シンガポールGP", track_value: 15 }, 
    { name: "アメリカGP", track_value: 60 }, { name: "メキシコGP", track_value: 50 },
    { name: "サンパウロGP", track_value: 45 }, { name: "ラスベガスGP", track_value: 85 },
    { name: "カタールGP", track_value: 70 }, { name: "アブダビGP", track_value: 50 },
];

/**
 * コース相性値 (0-100) をカテゴリ名に変換する
 */
function getTrackCategory(value) {
    if (value <= 10) return "超低速";
    if (value <= 30) return "低速";
    if (value <= 70) return "中速";
    if (value <= 90) return "高速";
    return "超高速";
}

/**
 * マシンのCompatibility値に基づき、得意分野のテキストを返す
 */
function getCompatibilityText(value) {
    if (value <= 20) return "超低速特化 (0-20)";
    if (value <= 40) return "低速・タイト (21-40)";
    if (value <= 60) return "平均的・中速 (41-60)";
    if (value <= 80) return "高速サーキット得意 (61-80)";
    return "超高速特化 (81-100)";
}

/**
 * マシンとコースの相性を計算し、パフォーマンス補正値を返す
 */
function calculatePerformanceBoost(team, trackValue) {
    const teamCompatibility = TEAM_RATES[team].compatibility;
    const difference = Math.abs(teamCompatibility - trackValue);
    const normalizedDiff = (difference - 50) / 50; 
    const boost = -normalizedDiff * 0.2; 
    return 1 + boost; 
}

/**
 * 予選順位に基づき、決勝パフォーマンススコアに加算するボーナス/ペナルティを計算する
 */
function calculateGridAdvantage(qualPosition) {
    const normalizedPosition = qualPosition - 10.5;
    const gridAdvantage = -normalizedPosition * (5.0 / 9.5); 
    return gridAdvantage;
}

/**
 * 新しいドライバー配列を作成（メンタリティと入賞数を初期化）
 */
function createInitialDriversArray() {
    return Object.entries(DRIVER_POOL).map(([name, data]) => ({
        name: name,
        team: data.team,
        attackRate: data.attack, 
        paceRate: data.pace, 
        stabilityRate: data.stability,
        mentality: 0, // 新パラメータ：メンタリティ
        points: 0, 
        wins: 0, 
        pp: 0, 
        podiums: 0, 
        pointsFinishes: 0, // 累計入賞数
        dnf: 0 
    }));
}

/**
 * 1レースの結果をシミュレーションし、ポイントと統計を計算する
 */
function simulateRace(drivers, race) {
    const MACHINE_WEIGHT = 0.7; 
    const DRIVER_WEIGHT = 0.3;  
    
    // メンタリティの変動率を計算する関数 (補正を2倍に)
    function getMentalityChangeRate(mentality) {
        // -100から100の範囲で、変動率を調整
        // 低いメンタリティでは変動率が高く、高いメンタリティでは低い
        const normalizedMentality = (mentality + 100) / 200; // 0-1の範囲に正規化
        const inverseNormalized = 1 - normalizedMentality;
        // 補正を2倍にする
        return 1 + (inverseNormalized - 0.5) * 2;
    }
    
    // メンタリティがパフォーマンスに与える影響度
    function getMentalityBoost(mentality) {
        // メンタリティ-100で-25%、100で+25%の影響
        const normalizedMentality = mentality / 100;
        return normalizedMentality * 0.25;
    }

    const trackValue = race.track_value;
    
    // シミュレーション対象のドライバーのコピー
    const raceDrivers = drivers.map(d => ({
        ...d,
        wins: 0,
        pp: 0,
        podiums: 0,
        dnfOccurred: false,
        score: 0,
        racePoints: 0,
        qualPosition: 0, 
        finalPosition: 0, // 決勝順位を一時的に保存
        mentalityChange: 0
    }));

    // 1. 予選シミュレーション (PP決定 & 1-20位確定) 
    let qualificationScores = raceDrivers.map(driver => {
        const team = driver.team;
        const machineRate = TEAM_RATES[team].attack_rate;
        const driverSkill = driver.attackRate; 
        
        const boostFactor = calculatePerformanceBoost(team, trackValue); 
        const effectiveMachineRate = machineRate * boostFactor; 
        
        const basePerformance = (effectiveMachineRate * 0.7) + (driverSkill * 0.3);
        const randomFactor = Math.random() * 30 - 15;
        
        // メンタリティを予選パフォーマンスに反映
        const mentalityEffect = getMentalityBoost(driver.mentality) * (basePerformance + randomFactor);
        
        return {
            ...driver,
            score: basePerformance + randomFactor + mentalityEffect
        };
    }).sort((a, b) => b.score - a.score);

    const qualificationResults = qualificationScores.map((d, index) => ({
        name: d.name,
        team: d.team,
        qualPosition: index + 1
    }));
    
    qualificationResults.forEach(qResult => {
        const driver = raceDrivers.find(d => d.name === qResult.name);
        if (driver) {
            driver.qualPosition = qResult.qualPosition;
            if (driver.qualPosition === 1) driver.pp = 1;
        }
    });

    // 2. 決勝パフォーマンススコア計算 (予選順位を考慮)
    raceDrivers.forEach(driver => {
        const team = driver.team;
        const machineRate = TEAM_RATES[team].pace_rate;
        const driverSkill = driver.paceRate; 
        const boostFactor = calculatePerformanceBoost(team, trackValue);
        const effectiveMachineRate = machineRate * boostFactor; 
        const gridAdvantage = calculateGridAdvantage(driver.qualPosition); 
        const basePerformance = (effectiveMachineRate * MACHINE_WEIGHT) + (driverSkill * DRIVER_WEIGHT);
        const randomFactor = Math.random() * 20 - 10; 
        
        // メンタリティを決勝パフォーマンスに反映
        const mentalityEffect = getMentalityBoost(driver.mentality) * (basePerformance + randomFactor);
        
        driver.score = basePerformance + randomFactor + gridAdvantage + mentalityEffect;
    });

    // 3. DNF/クラッシュのシミュレーション
    raceDrivers.forEach(driver => {
        const baseRisk = 0.10; 
        const maxStabilityEffect = 0.08; 
        const stabilityFactor = (driver.stabilityRate - 70) / 30; 
        const riskReduction = Math.max(0, stabilityFactor) * maxStabilityEffect;
        const dnfChance = Math.max(0.02, baseRisk - riskReduction); 
        
        if (Math.random() < dnfChance) {
            driver.dnfOccurred = true;
        }
    });

    // 4. 結果の集計とポイント付与 (決勝順位確定)
    const raceFinishers = raceDrivers.filter(d => !d.dnfOccurred).sort((a, b) => b.score - a.score);
    const raceRetirees = raceDrivers.filter(d => d.dnfOccurred).sort((a, b) => a.score - b.score);
    const finalRaceOrder = [...raceFinishers, ...raceRetirees];
    
    const finalResults = []; 
    
    // メンタリティの変動を計算
    finalRaceOrder.forEach((driverScore, index) => {
        const position = index + 1;
        
        // メンタリティ増減を計算
        let mentalityChange = (MENTALITY_CHANGE_BY_POS[position] || 0) / 4;
        
        if (driverScore.dnfOccurred) {
            mentalityChange = DNF_MENTALITY_PENALTY / 4;
        }
        
        // チームメイトと比較
        const teammate = finalRaceOrder.find(d => d.team === driverScore.team && d.name !== driverScore.name);
        if (teammate) {
            if (position < finalRaceOrder.indexOf(teammate) + 1) {
                mentalityChange += TEAMMATE_WIN_MENTALITY / 4;
            } else {
                mentalityChange += TEAMMATE_LOSE_MENTALITY / 4;
            }
        }
        
        // メンタリティの変動率補正を適用
        mentalityChange *= getMentalityChangeRate(driverScore.mentality);
        
        driverScore.mentalityChange = mentalityChange;
        driverScore.finalPosition = position;
        
        finalResults.push({
            position: position,
            name: driverScore.name,
            team: driverScore.team,
            status: driverScore.dnfOccurred ? "DNF" : "完走",
            qualPosition: driverScore.qualPosition,
            mentalityChange: mentalityChange 
        });
        
        if (position <= POINTS_SYSTEM.length && !driverScore.dnfOccurred) {
            driverScore.racePoints += POINTS_SYSTEM[index];
            if (position === 1) driverScore.wins = 1; 
            if (position <= 3) driverScore.podiums = 1; 
        }
    });

    return {
        winner: raceFinishers.length > 0 ? raceFinishers[0].name : "DNF (全員リタイア)",
        pp: qualificationResults[0].name,
        detailedResults: finalResults,
        stats: raceDrivers.map(d => ({
            name: d.name,
            team: d.team,
            racePoints: d.racePoints,
            wins: d.wins,
            pp: d.pp,
            podiums: d.podiums,
            pointsFinishes: d.pointsFinishes,
            dnf: d.dnfOccurred ? 1 : 0
        }))
    };
}

/**
 * シミュレーションを初期状態にリセットする
 */
function initializeSimulation() {
    currentRound = 0;
    currentDrivers = createInitialDriversArray();
    raceWinners = [];
    window.allRaceResults = [];

    updateDriversStandings(currentDrivers);
    updateConstructorsStandings(currentDrivers);
    updateDriverStats(currentDrivers);
    updateRaceWinners([]); 
    renderMachinePerformanceChart();
    document.getElementById('current-round').textContent = `現在：0 / 24 戦`;
}

/**
 * 指定された回数だけレースをシミュレートする
 */
function simulateNextRace(numRaces = 1) {
    if (currentRound >= RACE_CALENDAR.length) {
        alert("全レースが終了しました。再度シミュレーションを実行する場合は、初期化してください。");
        return;
    }

    const remainingRaces = RACE_CALENDAR.length - currentRound;
    const racesToSimulate = Math.min(numRaces, remainingRaces);

    for (let i = 0; i < racesToSimulate; i++) {
        const race = RACE_CALENDAR[currentRound];
        const raceResult = simulateRace(currentDrivers, race);

        raceWinners.push({
            id: currentRound,
            raceName: race.name,
            winner: raceResult.winner,
            pp: raceResult.pp,
            trackCategory: getTrackCategory(race.track_value),
            detailedResults: raceResult.detailedResults
        });

        // メンタリティと入賞数を加算
        currentDrivers = currentDrivers.map(driver => {
            const raceStat = raceResult.stats.find(s => s.name === driver.name);
            const raceFinalResult = raceResult.detailedResults.find(d => d.name === driver.name);

            if (raceStat && raceFinalResult) {
                driver.points += raceStat.racePoints;
                driver.wins += raceStat.wins;
                driver.pp += raceStat.pp;
                driver.podiums += raceStat.podiums;
                driver.dnf += raceStat.dnf;
                
                // メンタリティの変動を適用し、-100から100の範囲に制限
                driver.mentality += raceFinalResult.mentalityChange;
                driver.mentality = Math.max(-100, Math.min(100, driver.mentality));
                
                if (raceFinalResult.position <= 10) {
                    driver.pointsFinishes += 1;
                }
            }
            return driver;
        });
        currentRound++;
    }

    // グローバル変数に結果を保存
    window.allRaceResults = raceWinners;
    
    // UIを更新
    updateDriversStandings(currentDrivers);
    updateConstructorsStandings(currentDrivers);
    updateDriverStats(currentDrivers);
    updateRaceWinners(raceWinners);
    document.getElementById('current-round').textContent = `現在：${currentRound} / 24 戦`;
}

// ==========================================================
// ランキング/グラフ表示関数
// ==========================================================
function updateDriversStandings(finalDrivers) {
    finalDrivers.sort((a, b) => b.points - a.points);
    const tbody = document.getElementById('drivers-standings').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; 
    finalDrivers.forEach((driver, index) => {
        const row = tbody.insertRow();
        row.insertCell().textContent = index + 1;
        const driverCell = row.insertCell();
        driverCell.textContent = driver.name;
        driverCell.style.textDecoration = 'underline';
        driverCell.style.textDecorationColor = TEAM_COLORS[driver.team];
        driverCell.style.textDecorationThickness = '2px';
        driverCell.style.cursor = 'pointer';
        driverCell.onclick = () => showMentalityModal(driver.name, driver.mentality, driver.team);
        row.insertCell().textContent = driver.team;
        row.insertCell().textContent = driver.points;
    });
}
function updateConstructorsStandings(finalDrivers) {
    const constructorsPoints = {};
    finalDrivers.forEach(driver => {
        const team = driver.team;
        if (!constructorsPoints[team]) constructorsPoints[team] = 0;
        constructorsPoints[team] += driver.points;
    });
    const standings = Object.keys(constructorsPoints).map(team => ({
        team: team,
        points: constructorsPoints[team],
    }));
    standings.sort((a, b) => b.points - a.points);
    const tbody = document.getElementById('constructors-standings').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; 
    standings.forEach((constructor, index) => {
        const row = tbody.insertRow();
        row.insertCell().textContent = index + 1;
        const teamCell = row.insertCell();
        teamCell.textContent = constructor.team;
        teamCell.style.textDecoration = 'underline';
        teamCell.style.textDecorationColor = TEAM_COLORS[constructor.team];
        teamCell.style.textDecorationThickness = '2px';
        row.insertCell().textContent = constructor.points;
    });
}
function updateDriverStats(finalDrivers) {
    finalDrivers.sort((a, b) => b.points - a.points);
    const tbody = document.getElementById('driver-stats').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; 
    finalDrivers.forEach(driver => {
        const row = tbody.insertRow();
        const driverCell = row.insertCell();
        driverCell.textContent = driver.name;
        driverCell.style.textDecoration = 'underline';
        driverCell.style.textDecorationColor = TEAM_COLORS[driver.team];
        driverCell.style.textDecorationThickness = '2px';
        driverCell.style.cursor = 'pointer';
        driverCell.onclick = () => showMentalityModal(driver.name, driver.mentality, driver.team);
        row.insertCell().textContent = driver.wins;
        row.insertCell().textContent = driver.pp;
        row.insertCell().textContent = driver.podiums;
        row.insertCell().textContent = driver.pointsFinishes;
        row.insertCell().textContent = driver.dnf;
        row.insertCell().textContent = Math.round(driver.mentality); // メンタリティを追加
    });
}
function updateRaceWinners(winners) {
    const tbody = document.getElementById('race-winners').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; 
    winners.forEach((race, index) => {
        const row = tbody.insertRow();
        row.insertCell().textContent = index + 1; 
        const raceCell = row.insertCell();
        raceCell.textContent = `${race.raceName} (${race.trackCategory})`;
        raceCell.style.cursor = 'pointer'; 
        raceCell.style.textDecoration = 'underline'; 
        raceCell.addEventListener('click', () => showDetailedResults(race.id));
        row.insertCell().textContent = race.pp;
        row.insertCell().textContent = race.winner; 
    });
}
function showDetailedResults(raceId) {
    const race = window.allRaceResults.find(r => r.id === raceId);
    if (!race) return;
    let tableHtml = `
        <p><strong>レース名:</strong> ${race.raceName}</p>
        <div style="display: flex; justify-content: space-around;">
            <table class="detail-table">
                <thead>
                    <tr><th colspan="3" style="background-color: #f0f0f0;">予選順位 (PP)</th></tr>
                    <tr><th>順位</th><th>ドライバー</th><th>チーム</th></tr>
                </thead>
                <tbody>`;
    race.detailedResults
        .slice()
        .sort((a, b) => a.qualPosition - b.qualPosition)
        .forEach(d => {
            tableHtml += `
                <tr>
                    <td>${d.qualPosition}</td>
                    <td>${d.name}</td>
                    <td>${d.team}</td>
                </tr>`;
        });
    tableHtml += `
                </tbody>
            </table>
            <table class="detail-table" style="margin-left: 20px;">
                <thead>
                    <tr><th colspan="3" style="background-color: #e0f0e0;">決勝順位</th></tr>
                    <tr><th>順位</th><th>ドライバー</th><th>ステータス</th></tr>
                </thead>
                <tbody>`;
    race.detailedResults
        .slice()
        .sort((a, b) => a.position - b.position)
        .forEach(d => {
            tableHtml += `
                <tr>
                    <td>${d.position}</td>
                    <td>${d.name}</td>
                    <td>${d.status}</td>
                </tr>`;
        });
    tableHtml += `
                </tbody>
            </table>
        </div>`;
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; overflow-y: auto;">
            <h3>${race.raceName} - 詳細結果</h3>
            ${tableHtml}
            <button onclick="document.body.removeChild(this.parentNode.parentNode)" style="margin-top: 20px;">閉じる</button>
        </div>`;
    document.body.appendChild(modal);
}
function showMentalityModal(driverName, mentality, team) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    let statusText = '';
    if (mentality > 50) {
        statusText = '絶好調！集中力・モチベーションが最高潮です。';
    } else if (mentality > 10) {
        statusText = '好調。安定したパフォーマンスが期待できます。';
    } else if (mentality > -10) {
        statusText = '普通。特別なパフォーマンスは期待できません。';
    } else if (mentality > -50) {
        statusText = '不調。ミスや判断ミスが増えるかもしれません。';
    } else {
        statusText = 'スランプ。このままではリタイアの危険性が高まります。';
    }

    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; text-align: center;">
            <div style="width: 50px; height: 5px; background-color: ${TEAM_COLORS[team]}; margin: 0 auto 10px;"></div>
            <h3>${driverName}</h3>
            <p><strong>現在のメンタリティ:</strong> ${Math.round(mentality)}</p>
            <p style="margin-top: 20px;"><strong>状態:</strong> ${statusText}</p>
            <button onclick="document.body.removeChild(this.parentNode.parentNode)" style="margin-top: 20px;">閉じる</button>
        </div>`;
    document.body.appendChild(modal);
}
let machineChart = null; 
function renderMachinePerformanceChart() {
    const teamAverages = Object.entries(TEAM_RATES).map(([team, rates]) => {
        const average = (rates.attack_rate + rates.pace_rate) / 2;
        return { 
            team, 
            average,
            compatibility: rates.compatibility 
        };
    });
    const sortedTeams = teamAverages.sort((a, b) => b.average - a.average); 
    const teams = sortedTeams.map(t => t.team);
    const rates = sortedTeams.map(t => t.average); 
    const ctx = document.getElementById('machinePerformanceChart').getContext('2d');
    if (machineChart) {
        machineChart.destroy();
    }
    machineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teams,
            datasets: [{
                label: 'マシン性能レート (Attack/Pace 平均)',
                data: rates,
                backgroundColor: teams.map(team => TEAM_COLORS[team] || '#AAAAAA'), 
                borderColor: '#333',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 75, 
                    max: 100,
                    title: {
                        display: true,
                        text: '平均レート'
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'F1 2025 コンストラクターズ マシンレート (平均性能順)'
                },
                tooltip: {
                     callbacks: {
                         afterLabel: function(context) {
                             const team = context.label;
                             const teamRate = TEAM_RATES[team];
                             const compatibilityText = getCompatibilityText(teamRate.compatibility);
                             return [
                                 `Attack: ${teamRate.attack_rate}`,
                                 `Pace: ${teamRate.pace_rate}`,
                                 `Compatibility: ${teamRate.compatibility}`,
                                 `得意分野: ${compatibilityText}`
                             ];
                         }
                     }
                 }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .detail-table {
            border-collapse: collapse;
            width: 45%;
        }
        .detail-table th, .detail-table td {
            border: 1px solid #ccc;
            padding: 5px 10px;
            text-align: left;
            font-size: 0.9em;
        }
    `;
    document.head.appendChild(style);

    document.getElementById('initialize-button').addEventListener('click', initializeSimulation);
    document.getElementById('next-race-button').addEventListener('click', () => simulateNextRace(1));
    document.getElementById('step-races-button').addEventListener('click', () => {
        const stepCount = parseInt(document.getElementById('step-count').value, 10);
        if (!isNaN(stepCount) && stepCount > 0) {
            simulateNextRace(stepCount);
        } else {
            alert('有効なレース数を入力してください。');
        }
    });

    initializeSimulation();
});
