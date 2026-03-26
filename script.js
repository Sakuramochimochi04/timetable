// ===== 既存コードそのまま（DBとか人登録は省略せずそのまま使ってOK） =====

// ★ addUnitだけ変更
function addUnit(){
  let name = document.getElementById("unitName").value.trim();

  let min = parseInt(document.getElementById("unitMin").value);
  let sec = parseInt(document.getElementById("unitSec").value);

  // 空対策
  if(isNaN(min)) min = 0;
  if(isNaN(sec)) sec = 0;

  let time = min * 60 + sec;

  if(!name){
    alert("ユニット名入れて");
    return;
  }

  if(time === 0){
    alert("時間入れて");
    return;
  }

  if(selected.length === 0){
    alert("メンバー選んで");
    return;
  }

  units.push({ name, time, members:[...selected] });

  // リセット
  document.getElementById("unitName").value = "";
  document.getElementById("unitMin").value = "";
  document.getElementById("unitSec").value = "";

  selected = [];
  updateTag();
  renderUnits();
}
// ===== 時間変換 =====
function toSec(t){
  let [h,m,s]=t.split(":").map(Number);
  return h*3600+m*60+s;
}

function toTime(s){
  let h=Math.floor(s/3600);
  let m=Math.floor((s%3600)/60);
  let sec=s%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

// ===== 生成 =====
function generate(){
  let order = smartSchedule(units);

  let time = toSec(document.getElementById("startTime").value);

  let changeMin = parseInt(document.getElementById("changeMin").value) || 0;
  let changeSec = parseInt(document.getElementById("changeSec").value) || 0;
  let change = changeMin * 60 + changeSec;

  let breakMin = parseInt(document.getElementById("breakMin").value) || 0;
  let breakTime = breakMin * 60;

  let breakInterval = parseInt(document.getElementById("breakInterval").value) || 0;

  let html = "";

  order.forEach((u,index)=>{

    // 👇 メンバー表示追加
    let membersText = u.members.length > 0 ? `（${u.members.join(", ")}）` : "";

    html += `${toTime(time)} - ${u.name} ${membersText}（${Math.floor(u.time/60)}分${u.time%60}秒）<br>`;
    time += u.time;

    // 転換
    if(change > 0){
      html += `　↳ 転換（${changeMin}分${changeSec}秒）<br>`;
      time += change;
    }

    // 休憩
    if(breakInterval > 0 && (index+1)%breakInterval === 0 && index !== order.length-1){
      html += `★休憩（${breakMin}分）<br>`;
      time += breakTime;
    }
  });

  html += `<br>終了：${toTime(time)}`;

  document.getElementById("result").innerHTML = html;
}
