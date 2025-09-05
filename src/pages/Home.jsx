import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import { CONTRACTS, TOKEN_DECIMALS } from "../config";
import TokenABI from "../abi/PWKC.json";

export default function Home({ provider, signer, account }){
  const [balance, setBalance] = useState("0");

  useEffect(()=>{
    load();
  }, [provider, signer, account]);

  async function load(){
    if(!provider || !account) return;
    try{
      const token = new ethers.Contract(CONTRACTS.TOKEN, TokenABI, provider);
      const bal = await token.balanceOf(account);
      setBalance(ethers.formatUnits(bal, TOKEN_DECIMALS));
    }catch(e){ console.error(e); }
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">Home</h2>
      {account ? (
        <div className="bg-white p-4 rounded shadow">
          <p className="mb-2">Connected: <span className="font-mono">{account}</span></p>
          <p>PWKC Balance: <strong>{balance}</strong></p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded shadow">Please connect wallet (button top-right)</div>
      )}
    </div>
  );
}