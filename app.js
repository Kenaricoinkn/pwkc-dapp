// Navbar toggle
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Page navigation with animation
document.querySelectorAll("header nav a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();

    document.querySelectorAll(".page-section").forEach(s => {
      s.classList.remove("active");
    });

    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      setTimeout(() => {
        target.classList.add("active");
      }, 100); // delay biar smooth
    }

    navLinks.classList.remove("active"); // close nav on mobile
  });
});

// Dummy wallet data
let stakedAmount = 0;

// Swap simulation
function swapTokens() {
  const from = document.getElementById("swapFrom").value;
  const amount = parseFloat(document.getElementById("swapAmount").value);
  const resultEl = document.getElementById("swapResult");

  if (isNaN(amount) || amount <= 0) {
    resultEl.innerText = "Enter valid amount.";
    return;
  }

  let result = "";
  if (from === "USDC") {
    result = `You swapped ${amount} USDC for ${amount * 10} KN`;
  } else {
    result = `You swapped ${amount} KN for ${(amount / 10).toFixed(2)} USDC`;
  }

  resultEl.innerText = result;
}

// Stake simulation
function stakeTokens() {
  const amount = parseFloat(document.getElementById("stakeAmount").value);
  const resultEl = document.getElementById("stakeResult");

  if (isNaN(amount) || amount <= 0) {
    resultEl.innerText = "Enter valid amount.";
    return;
  }

  stakedAmount += amount;
  resultEl.innerText = `Staked: ${stakedAmount} KN`;
}

function withdrawStake() {
  const resultEl = document.getElementById("stakeResult");
  if (stakedAmount > 0) {
    resultEl.innerText = `Withdrew ${stakedAmount} KN`;
    stakedAmount = 0;
  } else {
    resultEl.innerText = "No staked amount.";
  }
}

// Faucet simulation
function claimFaucet() {
  const resultEl = document.getElementById("faucetResult");
  resultEl.innerText = "You claimed 100 KN!";
}

// Leaderboard dummy data
const leaderboardData = [
  { address: "0x1234...abcd", staked: 1200 },
  { address: "0x5678...efgh", staked: 950 },
  { address: "0x9abc...ijkl", staked: 750 },
];

const leaderboardList = document.getElementById("leaderboardList");
leaderboardData.forEach(user => {
  const li = document.createElement("li");
  li.textContent = `${user.address} — ${user.staked} KN`;
  leaderboardList.appendChild(li);
});
