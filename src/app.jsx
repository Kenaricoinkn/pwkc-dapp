import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import StakingFaucet from "./pages/StakingFaucet";
import MintNFT from "./pages/MintNFT";

export default function App(){
  const [page, setPage] = useState("home");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  // connect wallet
  async function connectWallet(){
    if(!window.ethereum) return alert("Please install MetaMask");
    try{
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const s = await prov.getSigner();
      const addr = await s.getAddress();
      const net = await prov.getNetwork();
      setProvider(prov);
      setSigner(s);
      setAccount(addr);
      setChainId(net.chainId);
      // listen for network/account changes
      window.ethereum.on("chainChanged", () => window.location.reload());
      window.ethereum.on("accountsChanged", () => window.location.reload());
    }catch(e){
      console.error(e);
      alert("Wallet connect failed");
    }
  }

  // try to switch to BSC (chainId 56). If not available ask to add.
  async function switchToBSC(targetChainId=56){
    if(!window.ethereum) return alert("No wallet");
    try{
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }]
      });
      // reload
      setTimeout(()=> window.location.reload(), 500);
    }catch(err){
      // try to add BSC mainnet if not found
      try{
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x38",
            chainName: "Binance Smart Chain Mainnet",
            nativeCurrency: { name: "Binance Coin", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com"]
          }]
        });
        setTimeout(()=> window.location.reload(), 500);
      }catch(e){
        console.error(e);
        alert("Please switch network manually in your wallet");
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar page={page} setPage={setPage} account={account} connectWallet={connectWallet} chainId={chainId} switchToBSC={switchToBSC} />
      <main className="max-w-5xl mx-auto p-6">
        {page==="home" && <Home provider={provider} signer={signer} account={account} />}
        {page==="leaderboard" && <Leaderboard provider={provider} signer={signer} />}
        {page==="staking" && <StakingFaucet provider={provider} signer={signer} account={account} />}
        {page==="nft" && <MintNFT provider={provider} signer={signer} account={account} />}
      </main>
    </div>
  );
}
