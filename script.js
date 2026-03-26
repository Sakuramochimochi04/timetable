// ===== DB =====
let db;
let request = indexedDB.open("timetableDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("persons", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = e => {
  db = e.target.result;
  loadPersons();
};

// ===== 人 =====
let persons = [];
let selected = [];

function addPerson(){
  let name = document.getElementById("personName").value.trim();
  if(!name) return;

  let tx = db.transaction("persons","readwrite");
  tx.objectStore("persons").add({name});

  document.getElementById("personName").value="";
  tx.oncomplete = loadPersons;
}

function loadPersons(){
  persons=[];
  let tx = db.transaction("persons","readonly");
  let store = tx.objectStore("persons");

  let html="";

  store.openCursor().onsuccess = e=>{
    let cursor=e.target.result;
    if(cursor){
      persons.push(cursor.value.name);

      html+=`
      <div>
        ${cursor.value.name}
        <button onclick="deletePerson(${cursor.value.id})">削除</button>
      </div>`;

      cursor.continue();
    }else{
      document.getElementById("personList").innerHTML=html;
      renderSelect();
    }
  };
}

function deletePerson(id){
  if(!confirm("削除する？")) return;

  let tx=db.transaction("persons","readwrite");
  tx.objectStore("persons").delete(id);

  tx.oncomplete = loadPersons;
}

// ===== ユニット =====
let units=[];

function renderSelect(){
  let html="";
  persons.forEach(p=>{
    html+=`<span class="tag" onclick="toggle('${p}')">${p}</span>`;
  });
  document.getElementById("selectPersons").innerHTML=html;
}

function toggle(name){
  if(selected.includes(name)){
    selected=selected.filter(n=>n!==name);
  }else{
    selected.push(name);
  }
  updateTag();
}

function updateTag(){
  document.querySelectorAll(".tag").forEach(tag=>{
    if(selected.includes(tag.innerText)){
      tag.classList.add("selected");
    }else{
      tag.classList.remove("selected");
    }
  });
}

function addUnit(){
  let name = document.getElementById("unitName").value.trim();
  let min = parseInt(document.getElementById("unitMin").value);
  let sec = parseInt(document.getElementById("unitSec").value);

  if(isNaN(min)) min=0;
  if(isNaN(sec)) sec=0;

  let time = min*60 + sec;

  if(!name){
    alert("ユニット名入れて");
    return;
  }
  if(time===0){
    alert("時間入れて");
    return;
  }
  if(selected.length===0){
    alert("メンバー選んで");
    return;
  }

  units.push({name,time,members:[...selected]});

  document.getElementById("unitName").value="";
  document.getElementById("unitMin").value="";
  document.getElementById("unitSec").value="";

  selected=[];
  updateTag();
  renderUnits();
}

function renderUnits(){
  let html="";
  units.forEach(u=>{
    html+=`<div class="unit">${u.name}（${u.members.join(", ")}）</div>`;
  });
  document.getElementById("unitList").innerHTML=html;
}

// ===== スケジューリング =====
function hasConflict(u1,u2){
  return u1.members.some(m=>u2.members.includes(m));
}

function smartSchedule(units){
  let result=[];
  let remaining=[...units];

  while(remaining.length>0){
    let placed=false;

    for(let i=0;i<remaining.length;i++){
      if(result.length===0 || !hasConflict(result[result.length-1],remaining[i])){
        result.push(remaining[i]);
        remaining.splice(i,1);
        placed=true;
        break;
      }
    }

    if(!placed){
      result.push({name:"休憩",time:300,members:[]});
    }
  }
  return result;
}

// ===== 時間 =====
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
  let order=smartSchedule(units);

  let time=toSec(document.getElementById("startTime").value);

  let changeMin=parseInt(document.getElementById("changeMin").value)||0;
  let changeSec=parseInt(document.getElementById("changeSec").value)||0;
  let change=changeMin*60+changeSec;

  let breakMin=parseInt(document.getElementById("breakMin").value)||0;
  let breakTime=breakMin*60;

  let breakInterval=parseInt(document.getElementById("breakInterval").value)||0;

  let html="";

  order.forEach((u,index)=>{
    let membersText = u.members.length>0 ? `（${u.members.join(", ")}）` : "";

    html+=`${toTime(time)} - ${u.name} ${membersText}（${Math.floor(u.time/60)}分${u.time%60}秒）<br>`;
    time+=u.time;

    if(change>0){
      html+=`　↳ 転換（${changeMin}分${changeSec}秒）<br>`;
      time+=change;
    }

    if(breakInterval>0 && (index+1)%breakInterval===0 && index!==order.length-1){
      html+=`★休憩（${breakMin}分）<br>`;
      time+=breakTime;
    }
  });

  html+=`<br>終了：${toTime(time)}`;

  document.getElementById("result").innerHTML=html;
}
