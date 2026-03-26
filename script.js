let db;

// DB作成
let req = indexedDB.open("timetableDB", 1);

req.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("people", { keyPath: "id", autoIncrement: true });
};

req.onsuccess = e => {
  db = e.target.result;
  loadPersons();
};

// 追加
function addPerson(){
  let name = document.getElementById("name").value.trim();
  if(!name) return;

  let tx = db.transaction("people", "readwrite");
  tx.objectStore("people").add({name});

  document.getElementById("name").value = "";

  tx.oncomplete = loadPersons;
}

// 表示
function loadPersons(){
  let tx = db.transaction("people", "readonly");
  let store = tx.objectStore("people");

  let html = "";

  store.openCursor().onsuccess = e => {
    let cursor = e.target.result;

    if(cursor){
      html += `
        <div class="item">
          ${cursor.value.name}
          <button onclick="deletePerson(${cursor.value.id})">削除</button>
        </div>
      `;
      cursor.continue();
    } else {
      document.getElementById("list").innerHTML = html;
    }
  };
}

// 削除
function deletePerson(id){
  if(!confirm("削除する？")) return;

  let tx = db.transaction("people", "readwrite");
  tx.objectStore("people").delete(id);

  tx.oncomplete = loadPersons;
}
