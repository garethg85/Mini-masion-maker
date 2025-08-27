const grid = document.getElementById("grid");
const blockType = document.getElementById("blockType");
let currentRotation = 0;
let darkMode = false;

function createGrid() {
  for (let i = 0; i < 80; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.style.width = "60px";
    cell.style.height = "60px";
    cell.style.background = "#ddd";
    cell.tabIndex = 0;  // keyboard focus support
    cell.setAttribute('role','gridcell');
    cell.onclick = () => placeBlock(cell);
    cell.onkeypress = (e) => { if(e.key==='Enter' || e.key===' ') placeBlock(cell); };
    grid.appendChild(cell);
  }
}

function placeBlock(cell) {
  const type = blockType.value;
  cell.className = `block ${type}`;
  cell.textContent = type === "vault" ? "🕵️" : type.charAt(0).toUpperCase();
  cell.style.transform = `rotate(${currentRotation}deg)`;
}

function rotateBlock() {
  currentRotation = (currentRotation + 90) % 360;
  alert(`Block rotation set to ${currentRotation}°`);
}

function resetGrid() {
  grid.innerHTML = "";
  createGrid();
}

function saveLayout() {
  const layout = [];
  grid.childNodes.forEach(cell => {
    layout.push({
      class: cell.className,
      text: cell.textContent,
      rotation: cell.style.transform
    });
  });
  localStorage.setItem("mansionLayout", JSON.stringify(layout));
  alert("Layout saved!");
}

function loadLayout() {
  const layout = JSON.parse(localStorage.getItem("mansionLayout"));
  if (!layout) {
    alert("No saved layout found.");
    return;
  }
  grid.childNodes.forEach((cell, i) => {
    cell.className = layout[i].class;
    cell.textContent = layout[i].text;
    cell.style.transform = layout[i].rotation;
  });
  alert("Layout loaded!");
}

function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle("dark-mode", darkMode);
}

// Initialize grid when page loads
createGrid();
