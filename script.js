function createTable() {
  const input = document.getElementById("input").value.trim().split("\n");
  const startTime = document.getElementById("startTime").value;
  const changeTime = parseInt(document.getElementById("changeTime").value);
  const breakInterval = parseInt(document.getElementById("breakInterval").value);
  const breakTime = parseInt(document.getElementById("breakTime").value);

  let list = input.map(line => {
    let [name, unit, time] = line.split(",");
    return { name, unit, time: parseInt(time) };
  });

  // 並び替え（同じ人連続しない）
  list = shuffleAvoidSame(list);

  let current = timeToMinutes(startTime);
  let result = "";

  list.forEach((item, index) => {
    result += `${minutesToTime(current)} - ${item.unit} (${item.name})<br>`;
    current += item.time;

    // 転換
    current += changeTime;

    // 休憩
    if ((index + 1) % breakInterval === 0 && index !== list.length - 1) {
      result += `<strong>--- 休憩 ---</strong><br>`;
      current += breakTime;
    }
  });

  result += `<br><strong>終了時間：${minutesToTime(current)}</strong>`;

  document.getElementById("result").innerHTML = result;
}

// 同じ人が連続しないようにする
function shuffleAvoidSame(list) {
  let shuffled = [...list].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length - 1; i++) {
    if (shuffled[i].name === shuffled[i + 1].name) {
      for (let j = i + 2; j < shuffled.length; j++) {
        if (shuffled[j].name !== shuffled[i].name) {
          [shuffled[i + 1], shuffled[j]] = [shuffled[j], shuffled[i + 1]];
          break;
        }
      }
    }
  }
  return shuffled;
}

// 時間→分
function timeToMinutes(time) {
  let [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// 分→時間
function minutesToTime(min) {
  let h = Math.floor(min / 60);
  let m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
