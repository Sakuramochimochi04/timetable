let members = JSON.parse(localStorage.getItem('dance_members')) || [];
let units = JSON.parse(localStorage.getItem('dance_units')) || [];

// 初期表示
updateMemberList();
updateUnitList();

// メンバー追加
function addMember() {
    const name = document.getElementById('memberInput').value.trim();
    if (name) {
        members.push(name);
        saveAndRefresh();
        document.getElementById('memberInput').value = '';
    }
}

// ユニット追加
function addUnit() {
    const name = document.getElementById('unitName').value;
    const min = parseInt(document.getElementById('unitMin').value) || 0;
    const sec = parseInt(document.getElementById('unitSec').value) || 0;
    const selectedMembers = Array.from(document.querySelectorAll('#unitMemberCheckboxes input:checked')).map(cb => cb.value);

    if (name && (min > 0 || sec > 0) && selectedMembers.length > 0) {
        units.push({ name, duration: min * 60 + sec, members: selectedMembers });
        saveAndRefresh();
        // フォームリセット
        document.getElementById('unitName').value = '';
        document.querySelectorAll('#unitMemberCheckboxes input').forEach(cb => cb.checked = false);
    } else {
        alert("ユニット名、時間、メンバーを選択してください");
    }
}

// 削除機能
function deleteItem(type, index) {
    if (type === 'member') members.splice(index, 1);
    else units.splice(index, 1);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('dance_members', JSON.stringify(members));
    localStorage.setItem('dance_units', JSON.stringify(units));
    updateMemberList();
    updateUnitList();
}

function updateMemberList() {
    const list = document.getElementById('memberList');
    const checkboxArea = document.getElementById('unitMemberCheckboxes');
    list.innerHTML = '';
    checkboxArea.innerHTML = '';

    members.forEach((m, i) => {
        list.innerHTML += `<li class="chip">${m}<span class="delete-btn" onclick="deleteItem('member', ${i})">×</span></li>`;
        checkboxArea.innerHTML += `<label><input type="checkbox" value="${m}"> ${m}</label>`;
    });
}

function updateUnitList() {
    const list = document.getElementById('unitList');
    list.innerHTML = '';
    units.forEach((u, i) => {
        list.innerHTML += `<li>${u.name} (${Math.floor(u.duration/60)}分${u.duration%60}秒) [${u.members.join(', ')}] <button onclick="deleteItem('unit', ${i})">削除</button></li>`;
    });
}

// タイムテーブル生成ロジック
function generateTimetable() {
    let currentTime = new Date(`2026/01/01 ${document.getElementById('startTime').value}`);
    const transition = parseInt(document.getElementById('transitionSec').value);
    const minRest = parseInt(document.getElementById('minRestMin').value) * 60;
    
    const tbody = document.getElementById('timetableBody');
    tbody.innerHTML = '';
    
    let lastPerformers = [];
    let tempUnits = [...units]; // 元データを壊さないようコピー

    while (tempUnits.length > 0) {
        // 次に可能なユニットを探す（前の出演者と被っていないもの）
        let nextIndex = tempUnits.findIndex(u => !u.members.some(m => lastPerformers.includes(m)));
        
        // もし全員被っていたら、強制的に休憩を入れる
        if (nextIndex === -1) {
            const restStart = formatTime(currentTime);
            currentTime = new Date(currentTime.getTime() + minRest * 1000);
            tbody.innerHTML += `<tr class="rest-row"><td>${restStart} - ${formatTime(currentTime)}</td><td>【強制休憩】連続出演回避</td><td>-</td></tr>`;
            lastPerformers = []; // 休憩後はリセット
            continue;
        }

        const unit = tempUnits.splice(nextIndex, 1)[0];
        
        // 表示用に追加
        const startStr = formatTime(currentTime);
        const performers = unit.members.join(', ');
        
        tbody.innerHTML += `<tr><td>${startStr}</td><td>${unit.name}</td><td>${performers}</td></tr>`;
        
        // 時間を進める
        currentTime = new Date(currentTime.getTime() + unit.duration * 1000);
        
        // 転換時間を追加（最後のユニット以外）
        if (tempUnits.length > 0) {
            tbody.innerHTML += `<tr class="rest-row"><td>${formatTime(currentTime)}</td><td>（転換 ${transition}秒）</td><td>-</td></tr>`;
            currentTime = new Date(currentTime.getTime() + transition * 1000);
        }
        
        lastPerformers = unit.members;
    }
    
    document.getElementById('resultArea').style.display = 'block';
}

function formatTime(date) {
    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ':' + date.getSeconds().toString().padStart(2, '0');
}
