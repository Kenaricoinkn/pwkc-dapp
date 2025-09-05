import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../config";
import NFTABI from "../abi/PWKCNFT.json";

export default function MintNFT({ signer, account }){
  const [mintFee, setMintFee] = useState(null);
  const [devWallet, setDevWallet] = useState(null);

  useEffect(()=>{ load(); }, [signer]);

  async function load(){
    try{
      const prov = signer ?? new ethers.BrowserProvider(window.ethereum);
      const nft = new ethers.Contract(CONTRACTS.NFT, NFTABI, prov);
      const fee = await nft.mintFee();
      const dev = await nft.devWallet();
      setMintFee(fee.toString());
      setDevWallet(dev);
    }catch(e){ console.error(e); }
  }

  async function doMint(){
    if(!signer) return alert("Connect wallet");
    try{
      const nft = new ethers.Contract(CONTRACTS.NFT, NFTABI, signer);
      const fee = mintFee ?? 0;
      const tx = await nft.mint({ value: fee });
      await tx.wait();
      alert("Mint success!");
    }catch(e){
      console.error(e);
      alert("Mint failed: " + (e?.message || ""));
    }
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">Mint NFT</h2>
      <div className="bg-white p-4 rounded shadow">
        <p>Dev wallet: <span className="font-mono">{devWallet ?? "loading..."}</span></p>
        <p>Mint fee: <strong>{mintFee ? ethers.formatEther(mintFee) + " BNB" : "loading..."}</strong></p>
        <button onClick={doMint} className="mt-3 bg-yellow-500 px-4 py-2 rounded">Mint NFT</button>
      </div>
    </div>
  );
}