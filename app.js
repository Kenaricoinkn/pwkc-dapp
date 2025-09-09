// ==========================
// Kenari Coin Web App Logic (Persisted)
// ==========================

// State aktif (di memori untuk sesi berjalan)
let currentWallet = null;
let currentUser = null;

// Kunci LocalStorage terpusat
const LS_KEYS = {
  USERS: "kenariUsers",        // [{username, walletAddr}]
  ACTIVE: "activeUser",        // "0xabc..."
  BALANCES: "kn_balances",     // {walletAddr: {KN, USDC}}
  STAKED: "kn_staked",         // {walletAddr: number}
  FAUCET: "kn_faucet"          // {walletAddr: timestamp}
};

// ==========================
// Util LocalStorage (map helpers)
// ==========================
function getMap(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch (_) { return {}; }
}
function setMap(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

// ==========================
// NAVIGATION & UI
// ==========================
function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("active");
}

function navigate(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(".nav-links").classList.remove("active"); // auto close menu

  if (id === "wallet") loadWallet();
}

function updateAuthUI() {
  const logoutLi = document.getElementById("logoutBtn");
  if (!logoutLi) return;
  logoutLi.style.display = currentWallet ? "block" : "none";
}

// ==========================
// LOGIN SYSTEM (Max 2 akun / device)
// ==========================
function getUsers() {
  try { return JSON.parse(localStorage.getItem(LS_KEYS.USERS)) || []; }
  catch (_) { return []; }
}
function saveUsers(users) {
  localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
}

function login() {
  const username = document.getElementById("usernameInput").value.trim();
  const walletAddr = document.getElementById("walletAddrInput").value.trim();
  const resultEl = document.getElementById("loginResult");

  if (!username || !walletAddr) {
    resultEl.innerText = "⚠️ Please enter username and wallet address.";
    return;
  }

  let users = getUsers();

  // Batas 2 akun per device
  if (users.length >= 2 && !users.find(u => u.walletAddr === walletAddr)) {
    resultEl.innerText = "⚠️ Maximum 2 accounts allowed per device. Please logout one account first.";
    return;
  }

  // Update atau tambah user
  const existing = users.find(u => u.walletAddr === walletAddr);
  if (existing) existing.username = username;
  else users.push({ username, walletAddr });

  saveUsers(users);
  localStorage.setItem(LS_KEYS.ACTIVE, walletAddr);

  currentUser = username;
  currentWallet = walletAddr;

  // Seed saldo kalau belum ada
  getBalance(walletAddr);

  resultEl.innerText = "✅ Login successful!";
  updateAuthUI();
  navigate("home");
  loadWallet();
}

function logout() {
  // Hapus user aktif dari daftar (logout = remove akun aktif dari device)
  let users = getUsers().filter(u => u.walletAddr !== currentWallet);
  saveUsers(users);

  localStorage.removeItem(LS_KEYS.ACTIVE);
  currentUser = null;
  currentWallet = null;

  updateAuthUI();
  navigate("login");
}

// Auto login saat load
window.onload = () => {
  const users = getUsers();
  const activeWallet = localStorage.getItem(LS_KEYS.ACTIVE);

  if (activeWallet && users.length > 0) {
    const active = users.find(u => u.walletAddr === activeWallet) || users[0];
    currentUser = active.username;
    currentWallet = active.walletAddr;
    updateAuthUI();
    navigate("home");
    loadWallet();
  } else {
    updateAuthUI();
    navigate("login");
  }
};

// ==========================
// BALANCE (Persisted)
// ==========================
function getBalance(addr) {
  const map = getMap(LS_KEYS.BALANCES);
  if (!map[addr]) {
    map[addr] = { KN: 1000, USDC: 500 }; // seed awal sekali saja
    setMap(LS_KEYS.BALANCES, map);
  }
  return { ...map[addr] }; // return copy supaya wajib set ulang saat ubah
}
function setBalance(addr, newBal) {
  const map = getMap(LS_KEYS.BALANCES);
  map[addr] = { KN: Number(newBal.KN) || 0, USDC: Number(newBal.USDC) || 0 };
  setMap(LS_KEYS.BALANCES, map);
}

function getStaked(addr) {
  const map = getMap(LS_KEYS.STAKED);
  return Number(map[addr] || 0);
}
function setStaked(addr, amount) {
  const map = getMap(LS_KEYS.STAKED);
  map[addr] = Number(amount) || 0;
  setMap(LS_KEYS.STAKED, map);
}

function getFaucetTime(addr) {
  const map = getMap(LS_KEYS.FAUCET);
  return Number(map[addr] || 0);
}
function setFaucetTime(addr, ts) {
  const map = getMap(LS_KEYS.FAUCET);
  map[addr] = Number(ts) || 0;
  setMap(LS_KEYS.FAUCET, map);
}

function loadWallet() {
  if (!currentWallet) return;
  const walletInfo = document.getElementById("walletInfo");
  const bal = getBalance(currentWallet);
  const st = getStaked(currentWallet);

  walletInfo.innerHTML = `
    <p><strong>User:</strong> ${currentUser}</p>
    <p><strong>Address:</strong> ${currentWallet}</p>
    <p><strong>Balance KN:</strong> ${bal.KN} KN</p>
    <p><strong>Balance USDC:</strong> ${bal.USDC} USDC</p>
    <p><strong>Staked:</strong> ${st} KN</p>
  `;
}

// ==========================
// SWAP (Dummy, persisted)
// ==========================
function swapTokens() {
  if (!currentWallet) return alert("⚠️ Please login first.");

  const from = document.getElementById("swapFrom").value;
  const amount = parseFloat(document.getElementById("swapAmount").value);
  const resultEl = document.getElementById("swapResult");

  if (!amount || amount <= 0) {
    resultEl.innerText = "⚠️ Enter valid amount.";
    return;
  }

  const bal = getBalance(currentWallet);

  if (from === "USDC") {
    if (bal.USDC < amount) {
      resultEl.innerText = "⚠️ Not enough USDC.";
      return;
    }
    bal.USDC -= amount;
    bal.KN += amount * 10; // rate dummy
    setBalance(currentWallet, bal);
    resultEl.innerText = `✅ Swapped ${amount} USDC → ${amount * 10} KN`;
  } else {
    if (bal.KN < amount) {
      resultEl.innerText = "⚠️ Not enough KN.";
      return;
    }
    bal.KN -= amount;
    bal.USDC += amount / 10; // rate dummy
    setBalance(currentWallet, bal);
    resultEl.innerText = `✅ Swapped ${amount} KN → ${(amount / 10).toFixed(2)} USDC`;
  }

  loadWallet();
}

// ==========================
// STAKING (Persisted)
// ==========================
function stakeTokens() {
  if (!currentWallet) return alert("⚠️ Please login first.");
  const amount = parseFloat(document.getElementById("stakeAmount").value);

  if (isNaN(amount) || amount <= 0) {
    alert("⚠️ Enter a valid amount to stake!");
    return;
  }

  let bal = getBalance(currentWallet);
  if (amount > bal.KN) {
    alert("⚠️ Not enough KN balance!");
    return;
  }

  // Kurangi balance
  bal.KN -= amount;
  setBalance(currentWallet, bal);

  // Tambahkan staking
  let st = getStaked(currentWallet);
  setStaked(currentWallet, st + amount);

  // Update UI
  updateActiveStakingUI();
  loadWallet();
  document.getElementById("stakeAmount").value = "";
}

function withdrawStake() {
  if (!currentWallet) return alert("⚠️ Please login first.");
  let st = getStaked(currentWallet);

  if (st <= 0) {
    alert("⚠️ No active staking to withdraw!");
    return;
  }

  // Kembalikan ke balance
  let bal = getBalance(currentWallet);
  bal.KN += st;
  setBalance(currentWallet, bal);

  // Reset staking
  setStaked(currentWallet, 0);

  // Update UI
  updateActiveStakingUI();
  loadWallet();
  alert(`✅ Successfully withdrawn ${st} KN`);
}

// UI staking aktif + animasi
function updateActiveStakingUI() {
  const activeStakingEl = document.getElementById("activeStaking");
  if (!activeStakingEl) return;

  let st = getStaked(currentWallet);
  if (st > 0) {
    activeStakingEl.innerHTML = `
      <span class="glowText">🔥 Active Staking: ${st} KN 🔥</span>
      <marquee behavior="scroll" direction="left" scrollamount="5">
        🚀 Your ${st} KN is working hard in staking pool... 🚀
      </marquee>
    `;
  } else {
    activeStakingEl.innerText = "No active staking";
  }
}

// Saat halaman dimuat cek staking
document.addEventListener("DOMContentLoaded", () => {
  updateActiveStakingUI();
});

// ==========================
// FAUCET (Persisted, 1x / 24h)
// ==========================
function claimFaucet() {
  if (!currentWallet) return alert("⚠️ Please login first.");

  const now = Date.now();
  const resultEl = document.getElementById("faucetResult");
  const last = getFaucetTime(currentWallet);

  const DAY_MS = 24 * 60 * 60 * 1000;
  if (last && now - last < DAY_MS) {
    const sisa = Math.ceil((DAY_MS - (now - last)) / (60 * 1000)); // sisa menit
    resultEl.innerText = `⚠️ Faucet already claimed. Try again in ~${sisa} minutes.`;
    return;
  }

  const bal = getBalance(currentWallet);
  bal.KN += 100;
  setBalance(currentWallet, bal);

  setFaucetTime(currentWallet, now);
  resultEl.innerText = "✅ You claimed 100 KN from faucet!";
  loadWallet();
}
