// Dummy storage
let balances = {};
let staked = {};
let faucetClaimed = {};
let currentWallet = null; // dari Wallet page

// Navigasi
function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("active");
}

function navigate(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// --- Wallet ---
function getBalance(addr) {
  if (!balances[addr]) {
    balances[addr] = { KN: 1000, USDC: 500 }; // saldo awal dummy
  }
  return balances[addr];
}

function loadWallet() {
  const addr = document.getElementById("walletInput").value.trim();
  const walletInfo = document.getElementById("walletInfo");

  if (!addr) {
    walletInfo.innerHTML = "<p style='color:red'>Please paste wallet address.</p>";
    return;
  }

  currentWallet = addr; // simpan address aktif
  const bal = getBalance(addr);
  walletInfo.innerHTML = `
    <p><strong>Address:</strong> ${addr}</p>
    <p><strong>Balance KN:</strong> ${bal.KN} KN</p>
    <p><strong>Balance USDC:</strong> ${bal.USDC} USDC</p>
    <p><strong>Staked:</strong> ${staked[addr] || 0} KN</p>
  `;
}

// --- Swap ---
function swapTokens() {
  const resultEl = document.getElementById("swapResult");
  if (!currentWallet) {
    resultEl.innerText = "Please set your wallet address in Wallet page first.";
    return;
  }

  const from = document.getElementById("swapFrom").value;
  const amount = parseFloat(document.getElementById("swapAmount").value);

  if (isNaN(amount) || amount <= 0) {
    resultEl.innerText = "Enter valid amount.";
    return;
  }

  const bal = getBalance(currentWallet);
  if (from === "USDC") {
    if (bal.USDC < amount) {
      resultEl.innerText = "Not enough USDC.";
      return;
    }
    bal.USDC -= amount;
    bal.KN += amount * 10;
    resultEl.innerText = `Swapped ${amount} USDC → ${amount * 10} KN`;
  } else {
    if (bal.KN < amount) {
      resultEl.innerText = "Not enough KN.";
      return;
    }
    bal.KN -= amount;
    bal.USDC += amount / 10;
    resultEl.innerText = `Swapped ${amount} KN → ${(amount / 10).toFixed(2)} USDC`;
  }
  loadWallet();
}

// --- Stake ---
function stakeTokens() {
  const resultEl = document.getElementById("stakeResult");
  if (!currentWallet) {
    resultEl.innerText = "Please set your wallet address in Wallet page first.";
    return;
  }

  const amount = parseFloat(document.getElementById("stakeAmount").value);
  if (isNaN(amount) || amount <= 0) {
    resultEl.innerText = "Enter valid amount.";
    return;
  }

  const bal = getBalance(currentWallet);
  if (bal.KN < amount) {
    resultEl.innerText = "Not enough KN balance.";
    return;
  }

  bal.KN -= amount;
  staked[currentWallet] = (staked[currentWallet] || 0) + amount;
  resultEl.innerText = `Staked: ${staked[currentWallet]} KN`;
  loadWallet();
}

// --- Withdraw ---
function withdrawStake() {
  const addr = document.getElementById("walletAddress").value.trim();
  const resultEl = document.getElementById("stakeResult");

  if (!addr) {
    resultEl.innerText = "Paste wallet address to withdraw.";
    return;
  }

  const bal = getBalance(addr);
  if (!staked[addr] || staked[addr] <= 0) {
    resultEl.innerText = "No staked KN.";
    return;
  }

  bal.KN += staked[addr];
  resultEl.innerText = `Withdrew ${staked[addr]} KN`;
  staked[addr] = 0;
  loadWallet();
}

// --- Faucet ---
function claimFaucet() {
  const addr = document.getElementById("faucetWallet").value.trim();
  const resultEl = document.getElementById("faucetResult");

  if (!addr) {
    resultEl.innerText = "Paste wallet address to claim faucet.";
    return;
  }

  const now = Date.now();
  if (faucetClaimed[addr] && now - faucetClaimed[addr] < 24 * 60 * 60 * 1000) {
    resultEl.innerText = "Already claimed faucet. Try again later.";
    return;
  }

  const bal = getBalance(addr);
  bal.KN += 100;
  faucetClaimed[addr] = now;
  resultEl.innerText = "You claimed 100 KN!";
  loadWallet();
}
