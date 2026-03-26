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
  let name = document.getElementById("personName").value;
  if(!name) return;

  let tx = db.transaction("persons","readwrite");
  tx.objectStore("persons").add({name});

  document.getElementById("personName").value="";
  loadPersons();
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
  let tx=db.transaction("persons","readwrite");
  tx.objectStore("persons").delete(id);
  loadPersons();
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
  let name=document.getElementById("unitName").value;
  let time=parseInt(document.getElementById("unitTime").value);

  if(!name || !time || selected.length===0) return;

  units.push({name,time,members:[...selected]});

  selected=[];
  updateTag();
  renderUnits();
}

function renderUnits(){
  let html="";
  units.forEach(u=>{
    html+=`<div class="unit">${u.name} (${u.time}s) - ${u.members.join(", ")}</div>`;
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
  let change=parseInt(document.getElementById("changeTime").value);

  let html="";

  order.forEach(u=>{
    html+=`${toTime(time)} - ${u.name}<br>`;
    time+=u.time+change;
  });

  html+=`<br>終了：${toTime(time)}`;

  document.getElementById("result").innerHTML=html;
}
