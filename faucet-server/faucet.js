// faucet.js (Backend Faucet KN untuk BSC Testnet)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

dotenv.config();

const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // private key wallet faucet
const TOKEN_ADDRESS = process.env.TOKEN_CONTRACT || "0xaD3Ce803305615C73CfEB2239254501738FD91b8";
const CLAIM_AMOUNT = process.env.CLAIM_AMOUNT || "100"; // 100 KN
const CLAIM_DECIMALS = Number(process.env.CLAIM_DECIMALS || 18);

if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY belum di set di file .env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Connect ke BSC Testnet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const faucetWallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Minimal ABI ERC20
const ERC20_ABI = [
  "function transfer(address to, uint amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];
const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, faucetWallet);

// Simpan data klaim di file JSON
const CLAIMS_FILE = path.join(process.cwd(), "claims.json");
let lastClaims = { byAddress: {}, byIP: {} };

try {
  if (fs.existsSync(CLAIMS_FILE)) {
    lastClaims = JSON.parse(fs.readFileSync(CLAIMS_FILE, "utf8"));
  }
} catch (e) {
  console.warn("⚠️ Gagal baca claims.json, mulai dari kosong.");
}

function saveClaims() {
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(lastClaims, null, 2));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Ambil IP user
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress;
}

app.get("/", (req, res) => res.json({ ok: true }));

// Endpoint Faucet
app.post("/faucet", async (req, res) => {
  const { address } = req.body;
  const ip = getClientIp(req) || "unknown";

  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "⚠️ Alamat wallet tidak valid." });
  }

  const now = Date.now();

  // Cek limit per address
  const lastAddr = lastClaims.byAddress[address] || 0;
  if (now - lastAddr < DAY_MS) {
    const minsLeft = Math.ceil((DAY_MS - (now - lastAddr)) / 60000);
    return res.status(429).json({ error: `⚠️ Sudah klaim. Coba lagi dalam ${minsLeft} menit.` });
  }

  // Cek limit per IP
  const lastIp = lastClaims.byIP[ip] || 0;
  if (now - lastIp < DAY_MS) {
    const minsLeft = Math.ceil((DAY_MS - (now - lastIp)) / 60000);
    return res.status(429).json({ error: `⚠️ IP ini sudah klaim. Coba lagi dalam ${minsLeft} menit.` });
  }

  try {
    const amount = ethers.parseUnits(CLAIM_AMOUNT.toString(), CLAIM_DECIMALS);

    // Cek saldo faucet wallet
    const faucetBalance = await tokenContract.balanceOf(faucetWallet.address);
    if (faucetBalance < amount) {
      return res.status(503).json({ error: "❌ Faucet kehabisan token." });
    }

    // Kirim token
    const tx = await tokenContract.transfer(address, amount);
    await tx.wait();

    // Simpan data klaim
    lastClaims.byAddress[address] = now;
    lastClaims.byIP[ip] = now;
    saveClaims();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("❌ Faucet error:", err);
    res.status(500).json({ error: "Faucet gagal", details: err?.message || String(err) });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Faucet server running on port ${PORT}`);
  console.log(`Faucet Wallet: ${faucetWallet.address}`);
  console.log(`Token KN: ${TOKEN_ADDRESS}`);
});
