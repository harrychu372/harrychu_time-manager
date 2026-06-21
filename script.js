// 請將此處替換為你部署好的 GAS 網頁應用程式 URL
const GAS_URL = "YOUR_GAS_WEB_APP_URL"; 

let timer;
let timeLeft;
let currentQuote = "";

// DOM 元素
const startBtn = document.getElementById('startBtn');
const taskNameInput = document.getElementById('taskName');
const durationSelect = document.getElementById('duration');
const timerDisplay = document.getElementById('timerDisplay');
const quoteBox = document.getElementById('quoteBox');
const statusText = document.getElementById('statusText');
const historyBody = document.getElementById('historyBody');

// 分頁切換邏輯
document.getElementById('tab-timer').addEventListener('click', (e) => switchTab(e, 'page-timer'));
document.getElementById('tab-dashboard').addEventListener('click', (e) => switchTab(e, 'page-dashboard'));

function switchTab(event, pageId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(pageId).classList.add('active');
}

// 監聽時間選擇器更動
durationSelect.addEventListener('change', () => {
    let mins = Math.floor(parseFloat(durationSelect.value));
    let secs = Math.round((parseFloat(durationSelect.value) % 1) * 60);
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

// 開始專注按鈕事件
startBtn.addEventListener('click', async () => {
    const taskName = taskNameInput.value.trim();
    if (!taskName) {
        alert('請先輸入你要專注的任務名稱！');
        return;
    }

    startBtn.disabled = true;
    taskNameInput.disabled = true;
    durationSelect.disabled = true;
    statusText.style.color = "#6c5ce7";
    statusText.textContent = "正在透過 API 獲取今日鞭策金句...";

    // 1. 呼叫第三方 API (自動填入功能)
    try {
        const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://zenquotes.io/api/random'));
        const data = await response.json();
        const quoteData = JSON.parse(data.contents)[0];
        currentQuote = `"${quoteData.q}" — ${quoteData.a}`;
    } catch (error) {
        currentQuote = "「拖延是最輕鬆的破產方式。」 — 預設鞭策金句";
    }
    quoteBox.innerHTML = `<strong>今日專注金句：</strong><br>${currentQuote}`;

    // 2. 計時器倒數開始
    statusText.textContent = "專注時間開始，全力以赴！";
    let totalSeconds = Math.round(parseFloat(durationSelect.value) * 60);
    timeLeft = totalSeconds;

    timer = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            alert('🎉 太棒了！你成功戰勝了拖延症！');
            handleTaskComplete(taskName, durationSelect.value, currentQuote);
        }
    }, 1000);
});

// 3. 處理任務完成：更新前端表格 + 上傳 GAS 試算表
async function handleTaskComplete(taskName, duration, quote) {
    statusText.style.color = "#00cec9";
    statusText.textContent = "正在將本期專注大數據上傳至雲端試算表...";

    const now = new Date();
    const completeDate = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // 先動態更新前端管理頁面表格
    const row = `<tr>
        <td><strong>${taskName}</strong></td>
        <td>${duration}</td>
        <td>${completeDate}</td>
        <td>${quote}</td>
    </tr>`;
    historyBody.insertAdjacentHTML('afterbegin', row);

    // 包裝資料打包傳送
    const payload = { taskName, duration, completeDate, quote };

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.result === "success") {
            statusText.textContent = "✅ 資料已成功同步至 Google Sheet 大數據庫！";
        } else {
            statusText.textContent = "❌ 同步失敗：" + result.message;
        }
    } catch (error) {
        statusText.textContent = "⚠️ 網路異常，但已暫存於本機畫面。";
    }

    // 重設狀態
    startBtn.disabled = false;
    taskNameInput.disabled = false;
    durationSelect.disabled = false;
    taskNameInput.value = "";
}