

let results = JSON.parse(localStorage.getItem('competitionResults')) || [];
const gradePoints = { A: 5, B: 3, C: 1 };

function submitResult() {
  const category = document.getElementById('category').value;
  const event = document.getElementById('event').value;
  if (!category || !event) {
    alert('ദയവായി വിഭാഗവും പരിപാടിയും ചേർക്കൂ');
    return;
  }

  const getEntry = (prefix, base) => {
    const team = document.getElementById(`${prefix}-team`).value;
    const name = document.getElementById(`${prefix}-name`).value;
    const chess = document.getElementById(`${prefix}-chess`).value;
    const grade = document.getElementById(`${prefix}-grade`).value;
    const extra = gradePoints[grade] || 0;
    return { position: prefix, team, name, chess, grade, points: base + extra };
  };

  const first = getEntry('first', 5);
  const second = getEntry('second', 3);
  const third = getEntry('third', 1);

  const gradeOnly = Array.from(document.querySelectorAll('.grade-only-entry')).map(div => {
    const [teamSel, nameI, chessI, gradeSel] = div.querySelectorAll('select, input, input, select');
    return {
      team: teamSel.value,
      name: nameI.value,
      chess: chessI.value,
      grade: gradeSel.value,
      category
    };
  });

  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    category,
    event,
    results: [first, second, third],
    gradeOnly
  };

  results.push(entry);
  localStorage.setItem('competitionResults', JSON.stringify(results));
  displayHistory();
  clearInputs();
}

function addGradeOnlyEntry() {
  const div = document.createElement('div');
  div.className = 'grade-only-entry';
  div.innerHTML = `
    <select><option value="">-- Select Team --</option><option>Hamdhala</option><option>Basmala</option></select>
    <input type="text" placeholder="Student Name" />
    <input type="text" placeholder="Chess No." />
    <select><option value="">-- Grade --</option><option>A</option><option>B</option><option>C</option></select>
    <br><br>
  `;
  document.getElementById('grade-only-container').appendChild(div);
}

function displayHistory() {
  const container = document.getElementById('history-list');
  container.innerHTML = '';

  if (!results.length) {
    container.innerHTML = '<p>No results yet.</p>';
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Event</th>
      <th>Category</th>
      <th>🥇 First</th>
      <th>🥈 Second</th>
      <th>🥉 Third</th>
      <th>Remove</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  results.forEach(entry => {
    const row = document.createElement('tr');

    const format = (res) =>
      `${res.team} (${res.name}, ${res.chess}) - Grade: ${res.grade || '-'}`;

    row.innerHTML = `
      <td>${entry.event}</td>
      <td>${entry.category}</td>
      <td>${format(entry.results[0])}</td>
      <td>${format(entry.results[1])}</td>
      <td>${format(entry.results[2])}</td>
      <td><button class="remove-btn" onclick="removeEntry(${entry.id})">Remove</button></td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  displayTeamPoints();
  displayTopPerformers();
}

function removeEntry(id) {
  results = results.filter(e => e.id !== id);
  localStorage.setItem('competitionResults', JSON.stringify(results));
  displayHistory();
}

function displayTeamPoints() {
  const map = {};
  results.forEach(r => {
    r.results.forEach(o => {
      if (!o.team) return;
      map[o.team] = (map[o.team] || 0) + o.points;
    });
    (r.gradeOnly || []).forEach(g => {
      if (g.team && gradePoints[g.grade]) {
        map[g.team] = (map[g.team] || 0) + gradePoints[g.grade];
      }
    });
  });

  const c = document.getElementById('team-points');
  c.innerHTML = '';

  Object.entries(map).sort((a, b) => b[1] - a[1]).forEach(([team, pts]) => {
    const d = document.createElement('div');
    d.className = 'team-card ' + (team.toLowerCase() === 'طيب المحبة' ? 'team-blue' : 'team-green');
    d.textContent = `${team} =  ${pts} `;
    c.appendChild(d);
  });
}

function displayTopPerformers() {
  const students = {};

  results.forEach(r => {
    [...r.results, ...(r.gradeOnly || [])].forEach(o => {
      if (!o.chess) return;
      const key = `${r.category}_${o.chess}`;
      if (!students[key]) {
        students[key] = {
          name: o.name,
          chess: o.chess,
          category: r.category,
          total: 0
        };
      }
      students[key].total += o.points || gradePoints[o.grade] || 0;
    });
  });

  const topByCategory = {};
  Object.values(students).forEach(s => {
    if (!topByCategory[s.category] || s.total > topByCategory[s.category].total) {
      topByCategory[s.category] = s;
    }
  });

  const container = document.getElementById('top-performers-list');
  container.innerHTML = '';

  if (!Object.keys(topByCategory).length) {
    container.innerHTML = '<p>No top performers yet.</p>';
    return;
  }

  const ul = document.createElement('ul');
  Object.entries(topByCategory).forEach(([cat, s]) => {
    const li = document.createElement('li');
    li.textContent = `${cat} → ${s.name} (${s.chess}), ${s.total} pts`;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

function clearInputs() {
  document.querySelectorAll('input, select').forEach(el => el.value = '');
  document.getElementById('grade-only-container').innerHTML = '';
}

function clearHistory() {
  document.getElementById("confirmModal").style.display = "flex";
}

function confirmClear(confirm) {
  document.getElementById("confirmModal").style.display = "none";
  if (confirm) {
    results = [];
    localStorage.removeItem('competitionResults');
    displayHistory();
  }
}


// New: Print only the result history + total team points + top performers
function printSelected() {
  const original = document.body.innerHTML;
  const printable = document.getElementById('print-section').innerHTML;
  document.body.innerHTML = `<div>${printable}</div>`;
  window.print();
  document.body.innerHTML = original;
  location.reload();
}

displayHistory();


function generateStudentSummary() {
  const history = JSON.parse(localStorage.getItem("competitionResults") || "[]");

  const summaryMap = {};

  history.forEach(entry => {
    const { category, event, results } = entry;

    results.forEach(res => {
      if (!res.chess || !res.name || !res.team) return;

      const key = `${category}_${res.chess}`;

      if (!summaryMap[key]) {
        summaryMap[key] = {
          category: category,
          chessNumber: res.chess,
          studentName: res.name,
          events: []
        };
      }

      summaryMap[key].events.push(`${event} (${res.position})`);
    });
  });

  const preferredOrder = [
    "Senior Boys",
    "Senior Girls",
    "Junior Boys",
    "Junior Girls",
    "Sub Junior Boys",
    "Sub Junior Girls"
  ];

  const summaryList = Object.values(summaryMap).sort((a, b) => {
    const ca = preferredOrder.indexOf(a.category);
    const cb = preferredOrder.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.chessNumber.localeCompare(b.chessNumber);
  });

  const summaryTable = document.getElementById("student-summary-body");
  summaryTable.innerHTML = "";

  summaryList.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.category}</td>
      <td>${student.chessNumber}</td>
      <td>${student.studentName}</td>
      <td>${student.events.join("<br>")}</td>
    `;
    summaryTable.appendChild(row);
  });
}

function printStudentSummary() {
  const content = document.getElementById("student-summary-section").innerHTML;
  const original = document.body.innerHTML;

  document.body.innerHTML = `<div>${content}</div>`;
  window.print();
  document.body.innerHTML = original;
  location.reload(); // reload to restore event listeners and state
}
