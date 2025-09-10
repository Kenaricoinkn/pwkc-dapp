import express from "express";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// Provider → BSC Testnet
const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

// Faucet wallet
const faucetWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ERC20 minimal ABI
const ERC20_ABI = [
  "function transfer(address to, uint amount) public returns (bool)"
];

// KN Token contract di BSC Testnet
const KN_TOKEN = "0xaD3Ce803305615C73CfEB2239254501738FD91b8";
const tokenContract = new ethers.Contract(KN_TOKEN, ERC20_ABI, faucetWallet);

// Memory storage untuk limitasi (bisa diganti Redis/DB di production)
const lastClaims = {}; // { address: timestamp }
const lastClaimsIP = {}; // { ip: timestamp }
const DAY_MS = 24 * 60 * 60 * 1000;

// Faucet API
app.post("/faucet", async (req, res) => {
  const { address } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  const now = Date.now();

  // Cek limit berdasarkan address
  if (lastClaims[address] && now - lastClaims[address] < DAY_MS) {
    const minsLeft = Math.ceil((DAY_MS - (now - lastClaims[address])) / 60000);
    return res.status(429).json({ error: `Already claimed. Try again in ${minsLeft} minutes.` });
  }

  // Cek limit berdasarkan IP
  if (lastClaimsIP[ip] && now - lastClaimsIP[ip] < DAY_MS) {
    const minsLeft = Math.ceil((DAY_MS - (now - lastClaimsIP[ip])) / 60000);
    return res.status(429).json({ error: `This IP already claimed. Try again in ${minsLeft} minutes.` });
  }

  try {
    const amount = ethers.parseUnits("100", 18); // 100 KN
    const tx = await tokenContract.transfer(address, amount);
    await tx.wait();

    // Simpan timestamp klaim
    lastClaims[address] = now;
    lastClaimsIP[ip] = now;

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Faucet failed" });
  }
});

app.listen(3000, () => console.log("🚰 Faucet KN running on http://localhost:3000"));
