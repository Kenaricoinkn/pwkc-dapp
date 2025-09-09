// Data storage
let balances = JSON.parse(localStorage.getItem("balances")) || {};
let staked = JSON.parse(localStorage.getItem("staked")) || {};
let faucetClaimed = JSON.parse(localStorage.getItem("faucetClaimed")) || {};
let currentUser = null;
let currentWallet = null;

// Navbar toggle
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("show");
});

// Close navbar auto
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("navLinks").classList.remove("show");
  });
});

// Navigation
function navigate(id) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// LocalStorage user functions
function getUsers() {
  return JSON.parse(localStorage.getItem("kenariUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("kenariUsers", JSON.stringify(users));
}

// Login
function login() {
  const username = document.getElementById("usernameInput").value.trim();
  const walletAddr = document.getElementById("walletAddrInput").value.trim();
  const resultEl = document.getElementById("loginResult");

  if (!username || !walletAddr) {
    resultEl.innerText = "Please enter username and wallet address.";
    return;
  }

  let users = getUsers();

  if (users.length >= 2 && !users.find(u => u.walletAddr === walletAddr)) {
    resultEl.innerText = "⚠️ Maximum 2 accounts allowed per device.";
    return;
  }

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

  if (!balances[walletAddr]) {
    balances[walletAddr] = { KN: 1000, USDC: 500 };
  }
  saveAll();

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
    if (!balances[currentWallet]) balances[currentWallet] = { KN: 1000, USDC: 500 };
    saveAll();
    navigate("home");
    loadWallet();
  } else {
    navigate("login");
  }
};

// Save all
function saveAll() {
  localStorage.setItem("balances", JSON.stringify(balances));
  localStorage.setItem("staked", JSON.stringify(staked));
  localStorage.setItem("faucetClaimed", JSON.stringify(faucetClaimed));
}

// Load Wallet
function loadWallet() {
  if (!currentWallet) return;
  const walletInfo = document.getElementById("walletInfo");
  const bal = balances[currentWallet] || { KN: 0, USDC: 0 };
  walletInfo.innerHTML = `
    <p><strong>User:</strong> ${currentUser}</p>
    <p><strong>Address:</strong> ${currentWallet}</p>
    <p><strong>Balance KN:</strong> ${bal.KN} KN</p>
    <p><strong>Balance USDC:</strong> ${bal.USDC} USDC</p>
    <p><strong>Staked:</strong> ${staked[currentWallet] || 0} KN</p>
  `;
}

// Swap
function swapTokens() {
  const from = document.getElementById("swapFrom").value;
  const amount = parseFloat(document.getElementById("swapAmount").value);
  const result = document.getElementById("swapResult");

  if (!currentWallet) { result.innerText = "Login first."; return; }
  if (isNaN(amount) || amount <= 0) { result.innerText = "Enter valid amount."; return; }

  let bal = balances[currentWallet];
  if (bal[from] < amount) { result.innerText = "Not enough balance."; return; }

  if (from === "USDC") {
    bal.USDC -= amount;
    bal.KN += amount * 10;
  } else {
    bal.KN -= amount;
    bal.USDC += amount / 10;
  }

  balances[currentWallet] = bal;
  saveAll();
  result.innerText = "✅ Swap successful!";
  loadWallet();
}

// Stake
function stakeTokens() {
  const amount = parseFloat(document.getElementById("stakeAmount").value);
  const result = document.getElementById("stakeResult");
  if (!currentWallet) { result.innerText = "Login first."; return; }
  if (isNaN(amount) || amount <= 0) { result.innerText = "Enter valid amount."; return; }

  let bal = balances[currentWallet];
  if (bal.KN < amount) { result.innerText = "Not enough KN."; return; }

  bal.KN -= amount;
  staked[currentWallet] = (staked[currentWallet] || 0) + amount;
  balances[currentWallet] = bal;
  saveAll();

  result.innerText = `✅ You staked ${amount} KN.`;
  loadWallet();

  // Animasi progress
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  let width = 0;
  progressBar.style.width = "0%";
  progressText.innerText = "Staking in progress...";
  let interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
      progressText.innerText = `🔥 Staked ${amount} KN successfully!`;
    } else {
      width += 2;
      progressBar.style.width = width + "%";
    }
  }, 200);
}

// Withdraw
function withdrawStake() {
  if (!currentWallet) return;
  let amount = staked[currentWallet] || 0;
  if (amount <= 0) return;

  balances[currentWallet].KN += amount;
  staked[currentWallet] = 0;
  saveAll();
  loadWallet();

  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").innerText = "No active staking";
  document.getElementById("stakeResult").innerText = "❌ Withdraw successful.";
}

// Faucet
function claimFaucet() {
  if (!currentWallet) { document.getElementById("faucetResult").innerText = "Login first."; return; }

  let lastClaim = faucetClaimed[currentWallet] || 0;
  let now = Date.now();
  if (now - lastClaim < 24 * 60 * 60 * 1000) {
    document.getElementById("faucetResult").innerText = "⏳ Faucet already claimed, wait 24h.";
    return;
  }

  balances[currentWallet].KN += 100;
  faucetClaimed[currentWallet] = now;
  saveAll();
  loadWallet();

  document.getElementById("faucetResult").innerText = "✅ Faucet claimed +100 KN.";
}
