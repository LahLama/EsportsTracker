// ---- CONFIGURE THESE ----
  const SHEET_ID = "15wBVULdiVFiZdog-dRgd4xAerea8PSleQJ-juXwJaOk";
  const SHEET_NAME = "Manual"; // the tab name, not the whole doc name
  // Optional: SQL-like query, e.g. "SELECT A, B WHERE C > 100 ORDER BY A"
  const QUERY = "";
  let rows = [];
  let cols = []
  // --------------------------

  async function loadSheetData() {
    // const statusEl = document.getElementById("status");
    const tableEl = document.getElementById("sheet-table");

    let url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
    if (QUERY) url += `&tq=${encodeURIComponent(QUERY)}`;

    try {
      const res = await fetch(url);
      const text = await res.text();

      // Response looks like: google.visualization.Query.setResponse({...});
      // Strip everything before the first "{" and the trailing ");"
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));

      // console.log(json.table.cols);   // see your columns
      // console.log(json.table.rows);   // see your raw rows
      // console.log(json);              // see everything

      if (json.status === "error") {
        throw new Error(json.errors?.[0]?.detailed_message || "Query error");
      }

      // Trim column labels so headers like "Sentinel " (trailing space)
      // still match role names like "Sentinel" used elsewhere in this file.
      cols = json.table.cols.map(c => (c.label || c.id || "").trim());
      rows = json.table.rows.map(r => r.c.map(cell => cell ? cell.f ?? cell.v : ""));

      renderAllCards();

      // statusEl.textContent = `Loaded ${rows.length} rows • ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      // statusEl.textContent = "Error loading sheet data.";
      // statusEl.classList.add("error");
      console.error(err);
    }
  }

// Pulls just the tier name out of a value like "Silver 2" or "Immortal 3" -> "Silver" / "Immortal"
// so it can be matched against the ranks list and used to build the icon filename.
function parseRankTier(rawRank) {
  if (!rawRank) return "";
  return rawRank.toString().trim().split(/\s+/)[0];
}

function createPlayerCard(hero) {
  let card = document.createElement("div");
  card.classList.add("player-card");

  const roles = ["Duelist", "Controller", "Initiator", "Sentinel"];
  const roleLines = roles
    .filter(role => hero[role])
    .map(role => `<p class="infoBlock">${role} <img src="./ValImages/roles/${role.toLowerCase()}.webp" class="roleIcon" alt="${hero[role]}">: ${hero[role]}</p>`)
    .join("");

  const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"];

  const rawRank = hero["Current Rank"] || "";
  const rankTier = parseRankTier(rawRank);
  const displayRank = rawRank || "Unranked";

  if (ranks.includes(rankTier)) {
    console.log(`Rank ${rankTier} is valid.`);
  } else {
    console.log(`Rank "${rankTier}" not recognized, defaulting icon.`);
  }

  const rankIconTier = ranks.includes(rankTier) ? rankTier.toLowerCase() : "unranked";

  const heroName = hero["Favourite Valorant Agent"]?.trim();
  const heroImage = heroName ? "./ValImages/" + heroName.toLowerCase() + ".webp" : "./ValImages/none.webp";

  card.innerHTML = `
  <h2 class="acglName">${hero["ACGL"]}</h2>
  <img 
    class="mainHero" 
    src="${heroImage}" 
    alt="${hero["Favourite Valorant Agent"]}"
    onerror="this.onerror=null; this.src='none.';"
  >
  <div class="name infoBlock">Name: ${hero["Name"]}</div>
  <div class="GameName infoBlock">Valorant Name: ${hero["Valorant"]}</div>
  <div class="level infoBlock">Level: ${hero["Level"]}</div>
  <div class="roleContainer infoBlock">Preferred Role:

    ${roleLines}
 
  </div>
  <div class="rankContainer infoBlock">Current Rank:
    <img src="./ValImages/ranks/${rankIconTier}.webp" class="rankIcon" alt="${displayRank}">
    ${displayRank}
  </div>
  <div class="trackersContainer">Trackers:
    <br><a href="${hero["Tracker.GG"]}" target="_blank">Tracker.gg</a>

    
  </div>
`;

  return card;
}


function getRowData(rowIndex) {
  const row = rows[rowIndex];
  if (!row) {
    console.error(`No row at index ${rowIndex}`);
    return null;
  }

  const rowData = {};
  cols.forEach((colName, i) => {
    rowData[colName] = row[i];
  });

  return rowData;
}


  function renderTable(cols, rows) {
    const table = document.getElementById("sheet-table");
    table.innerHTML = "";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    cols.forEach(c => {
      const th = document.createElement("th");
      th.textContent = c;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }

  loadSheetData();


function renderAllCards() {
  const container = document.getElementById("cards-container"); // add this div to your HTML
  container.innerHTML = "";

  rows.forEach((row, index) => {
    const hero = getRowData(index);
    const card = createPlayerCard(hero);
    container.appendChild(card);
  });
}

  function getMemberData(val) {
    let hero = getRowData(val);
    console.log(hero);
    return hero;
  }

  // Uncomment to auto-refresh every 30 seconds:
  // setInterval(loadSheetData, 30000);