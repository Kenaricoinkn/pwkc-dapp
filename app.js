// ==========================
// Kenari Coin Web App Logic
// ==========================

// Dummy storage
let balances = {};
let staked = {};
let faucetClaimed = {};
let currentWallet = null;
let currentUser = null;

// ==========================
// NAVIGATION
// ==========================
function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("active");
}

function navigate(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(".nav-links").classList.remove("active"); // auto close menu

  if (id === "wallet") {
    loadWallet();
  }
}

// ==========================
// LOGIN SYSTEM (Max 2 Accounts)
// ==========================
function getUsers() {
  return JSON.parse(localStorage.getItem("kenariUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("kenariUsers", JSON.stringify(users));
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

  // Max 2 accounts check
  if (users.length >= 2 && !users.find(u => u.walletAddr === walletAddr)) {
    resultEl.innerText = "⚠️ Maximum 2 accounts allowed per device. Please logout one account first.";
    return;
  }

  // Check if wallet already exists → update username
  let existing = users.find(u => u.walletAddr === walletAddr);
  if (existing) {
    existing.username = username;
  } else {
    users.push({ username, walletAddr });
  }

  saveUsers(users);

  currentUser = username;
  currentWallet = walletAddr;

  localStorage.setItem("activeUser", walletAddr);

  resultEl.innerText = "✅ Login successful!";
  navigate("home");
  loadWallet();
}

// Auto login
window.onload = () => {
  const users = getUsers();
  const activeWallet = localStorage.getItem("activeUser");

  if (activeWallet && users.length > 0) {
    let active = users.find(u => u.walletAddr === activeWallet) || users[0];
    currentUser = active.username;
    currentWallet = active.walletAddr;
    navigate("home");
    loadWallet();
  } else {
    navigate("login");
  }
};

// Logout
function logout() {
  let users = getUsers().filter(u => u.walletAddr !== currentWallet);
  saveUsers(users);

  currentUser = null;
  currentWallet = null;
  localStorage.removeItem("activeUser");

  navigate("login");
}

// ==========================
// WALLET BALANCE
// ==========================
function getBalance(addr) {
  if (!balances[addr]) {
    balances[addr] = { KN: 1000, USDC: 500 }; // dummy initial balance
  }
  return balances[addr];
}

function loadWallet() {
  if (!currentWallet) return;

  const walletInfo = document.getElementById("walletInfo");
  const bal = getBalance(currentWallet);

  walletInfo.innerHTML = `
    <p><strong>User:</strong> ${currentUser}</p>
    <p><strong>Address:</strong> ${currentWallet}</p>
    <p><strong>Balance KN:</strong> ${bal.KN} KN</p>
    <p><strong>Balance USDC:</strong> ${bal.USDC} USDC</p>
    <p><strong>Staked:</strong> ${staked[currentWallet] || 0} KN</p>
  `;
}

// ==========================
// SWAP (Dummy)
// ==========================
function swapTokens() {
  if (!currentWallet) {
    alert("⚠️ Please login first.");
    return;
  }

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
    bal.KN += amount * 10; // dummy rate
    resultEl.innerText = `✅ Swapped ${amount} USDC → ${amount * 10} KN`;
  } else {
    if (bal.KN < amount) {
      resultEl.innerText = "⚠️ Not enough KN.";
      return;
    }
    bal.KN -= amount;
    bal.USDC += amount / 10; // dummy rate
    resultEl.innerText = `✅ Swapped ${amount} KN → ${amount / 10} USDC`;
  }

  loadWallet();
}

// ==========================
// STAKING (Dummy)
// ==========================
function stakeTokens() {
  if (!currentWallet) {
    alert("⚠️ Please login first.");
    return;
  }

  const amount = parseFloat(document.getElementById("stakeAmount").value);
  const resultEl = document.getElementById("stakeResult");
  const bal = getBalance(currentWallet);

  if (!amount || amount <= 0) {
    resultEl.innerText = "⚠️ Enter valid amount.";
    return;
  }

  if (bal.KN < amount) {
    resultEl.innerText = "⚠️ Not enough KN.";
    return;
  }

  bal.KN -= amount;
  staked[currentWallet] = (staked[currentWallet] || 0) + amount;

  resultEl.innerText = `✅ Staked ${amount} KN successfully!`;
  loadWallet();
}

function withdrawStake() {
  if (!currentWallet) {
    alert("⚠️ Please login first.");
    return;
  }

  const resultEl = document.getElementById("stakeResult");
  const stakedAmt = staked[currentWallet] || 0;
  const bal = getBalance(currentWallet);

  if (stakedAmt <= 0) {
    resultEl.innerText = "⚠️ No staked balance.";
    return;
  }

  bal.KN += stakedAmt;
  staked[currentWallet] = 0;

  resultEl.innerText = `✅ Withdrawn ${stakedAmt} KN from staking.`;
  loadWallet();
}

// ==========================
// FAUCET (Dummy, 1x per 24h)
// ==========================
function claimFaucet() {
  if (!currentWallet) {
    alert("⚠️ Please login first.");
    return;
  }

  const now = Date.now();
  const resultEl = document.getElementById("faucetResult");

  if (faucetClaimed[currentWallet] && now - faucetClaimed[currentWallet] < 24 * 60 * 60 * 1000) {
    resultEl.innerText = "⚠️ Faucet already claimed. Try again in 24 hours.";
    return;
  }

  const bal = getBalance(currentWallet);
  bal.KN += 100;

  faucetClaimed[currentWallet] = now;
  resultEl.innerText = "✅ You claimed 100 KN from faucet!";
  loadWallet();
}
