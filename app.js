// ==========================
// Kenari Coin Web App Logic (Persisted + Leaderboard)
// ==========================

// State aktif
let currentWallet = null;
let currentUser = null;

// const FAUCET_API_URL = "http://localhost:3000/faucet";
const FAUCET_API_URL = "https://kenari-faucet-server-production.up.railway.app/faucet";
// Kunci LocalStorage
const LS_KEYS = {
  USERS: "kenariUsers",        // [{username, walletAddr}]
  ACTIVE: "activeUser",        // "0xabc..."
  BALANCES: "kn_balances",     // {walletAddr: {KN, USDC}}
  STAKED: "kn_staked",         // {walletAddr: number}
  FAUCET: "kn_faucet",         // {walletAddr: timestamp}
  LEADERBOARD: "kn_leaderboard"// [{username, walletAddr, staked}]
};

// ==========================
// Util LocalStorage
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
  document.querySelector(".nav-links").classList.remove("active"); // auto close

  if (id === "wallet") {
    loadWallet();
    updateActiveStakingUI();
  }
  if (id === "leaderboard") {
    loadLeaderboard();
  }
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

  // Seed saldo
  getBalance(walletAddr);

  resultEl.innerText = "✅ Login successful!";
  updateAuthUI();
  navigate("home");
  loadWallet();
  updateActiveStakingUI();
  loadLeaderboard();
}

function logout() {
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
    updateActiveStakingUI();
    loadLeaderboard();
  } else {
    updateAuthUI();
    navigate("login");
  }
};

// ==========================
// BALANCE
// ==========================
function getBalance(addr) {
  const map = getMap(LS_KEYS.BALANCES);
  if (!map[addr]) {
    map[addr] = { KN: 1000, USDC: 500 };
    setMap(LS_KEYS.BALANCES, map);
  }
  return { ...map[addr] };
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
  const faucetInput = document.getElementById("faucetAddressInput");
if (faucetInput) faucetInput.value = currentWallet || "";
}

// ==========================
// SWAP
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
    bal.KN += amount * 10;
    setBalance(currentWallet, bal);
    resultEl.innerText = `✅ Swapped ${amount} USDC → ${amount * 10} KN`;
  } else {
    if (bal.KN < amount) {
      resultEl.innerText = "⚠️ Not enough KN.";
      return;
    }
    bal.KN -= amount;
    bal.USDC += amount / 10;
    setBalance(currentWallet, bal);
    resultEl.innerText = `✅ Swapped ${amount} KN → ${(amount / 10).toFixed(2)} USDC`;
  }

  loadWallet();
}

// ==========================
// STAKING
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

  bal.KN -= amount;
  setBalance(currentWallet, bal);

  let st = getStaked(currentWallet);
  setStaked(currentWallet, st + amount);

  updateActiveStakingUI();
  loadWallet();
  document.getElementById("stakeAmount").value = "";

  loadLeaderboard();
}

function withdrawStake() {
  if (!currentWallet) return alert("⚠️ Please login first.");
  let st = getStaked(currentWallet);

  if (st <= 0) {
    alert("⚠️ No active staking to withdraw!");
    return;
  }

  let bal = getBalance(currentWallet);
  bal.KN += st;
  setBalance(currentWallet, bal);

  setStaked(currentWallet, 0);

  updateActiveStakingUI();
  loadWallet();
  alert(`✅ Successfully withdrawn ${st} KN`);

  loadLeaderboard();
}

function updateActiveStakingUI() {
  const activeStakingEl = document.getElementById("activeStaking");
  if (!activeStakingEl || !currentWallet) return;

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

// ==========================
// FAUCET
// ==========================
async function claimFaucet() {
  const addrInput = document.getElementById("faucetAddressInput");
  const resultEl = document.getElementById("faucetResult");
  const btn = document.getElementById("claimFaucetBtn");

  resultEl.innerText = "";

  // Ambil dari input atau currentWallet
  const address = (addrInput && addrInput.value.trim()) || (currentWallet || "");
  if (!address) {
    resultEl.innerText = "⚠️ Please enter/paste a BSC Testnet address first.";
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "Claiming...";
  }

  try {
    const res = await fetch(FAUCET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      resultEl.innerHTML = `✅ 100 KN sent! 
        <a href="https://testnet.bscscan.com/tx/${data.txHash}" target="_blank">View Tx</a>`;
    } else {
      resultEl.innerText = `⚠️ ${data.error || "Faucet failed"}`;
    }
  } catch (err) {
    console.error("Faucet frontend error:", err);
    resultEl.innerText = "⚠️ Error connecting to faucet server.";
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Claim Faucet";
    }
  }
}

// ==========================
// LEADERBOARD (Persistent)
// ==========================
function seedDummyLeaderboard(n = 50) {
  const existing = JSON.parse(localStorage.getItem(LS_KEYS.LEADERBOARD) || "null");
  if (existing) return existing;

  const list = [];
  for (let i = 0; i < n; i++) {
    const addr =
      "0x" +
      Math.random().toString(16).substr(2, 8) +
      "..." +
      Math.random().toString(16).substr(2, 4);
    const stake = Math.floor(Math.random() * 10000) + 100;
    list.push({ username: "User" + (i + 1), walletAddr: addr, staked: stake });
  }
  localStorage.setItem(LS_KEYS.LEADERBOARD, JSON.stringify(list));
  return list;
}

function getLeaderboard() {
  return JSON.parse(localStorage.getItem(LS_KEYS.LEADERBOARD) || "[]");
}
function saveLeaderboard(list) {
  localStorage.setItem(LS_KEYS.LEADERBOARD, JSON.stringify(list));
}

function shortenAddr(addr) {
  if (!addr) return "";
  return addr.substring(0, 6) + "..." + addr.slice(-4);
}

function loadLeaderboard(showAll = false) {
  let dummy = seedDummyLeaderboard(50);
  let users = getUsers();

  let realUsers = users.map((u) => ({
    username: u.username,
    walletAddr: u.walletAddr,
    staked: getStaked(u.walletAddr),
  }));

  let all = [...dummy, ...realUsers];
  all.sort((a, b) => b.staked - a.staked);

  saveLeaderboard(all);

  const leaderboardEl = document.getElementById("leaderboardList");
  if (!leaderboardEl) return;

  let html =
    "<table><tr><th>Rank</th><th>User</th><th>Wallet</th><th>Staked KN</th></tr>";

  let displayData = showAll ? all : all.slice(0, 15);

  displayData.forEach((u, i) => {
    const highlight =
      currentWallet && u.walletAddr === currentWallet ? " style='background:#222;color:#0f0;'" : "";
    html += `<tr${highlight}>
      <td>#${i + 1}</td>
      <td>${u.username}</td>
      <td>${shortenAddr(u.walletAddr)}</td>
      <td>${u.staked}</td>
    </tr>`;
  });
  html += "</table>";

  // Tambah tombol Show More / Show Less
  if (!showAll && all.length > 15) {
    html += `<div style="text-align:center; margin-top:10px;">
               <button id="showMoreBtn" style="padding:8px 16px; background:#FFD700; color:#000; border:none; border-radius:6px; cursor:pointer;">
                 Show More
               </button>
             </div>`;
  } else if (showAll && all.length > 15) {
    html += `<div style="text-align:center; margin-top:10px;">
               <button id="showLessBtn" style="padding:8px 16px; background:#FFD700; color:#000; border:none; border-radius:6px; cursor:pointer;">
                 Show Less
               </button>
             </div>`;
  }

  leaderboardEl.innerHTML = html;

  // Event tombol
  if (!showAll && all.length > 15) {
    document.getElementById("showMoreBtn").addEventListener("click", () =>
      loadLeaderboard(true)
    );
  } else if (showAll && all.length > 15) {
    document.getElementById("showLessBtn").addEventListener("click", () =>
      loadLeaderboard(false)
    );
  }
}
