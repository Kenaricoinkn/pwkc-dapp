import React, {useState, useEffect} from "react";
import { ethers } from "ethers";
import { CONTRACTS, TOKEN_DECIMALS } from "../config";
import TokenABI from "../abi/PWKC.json";
import FaucetABI from "../abi/PWKCFaucet.json";
import StakingABI from "../abi/PWKCStaking.json";

export default function StakingFaucet({ provider, signer, account }){
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState("0");
  const [apy, setApy] = useState("0");
  const [faucetCooldown, setFaucetCooldown] = useState(null);

  useEffect(()=>{ load(); }, [provider, signer, account]);

  async function load(){
    if(!provider) return;
    try{
      const prov = provider;
      const staking = new ethers.Contract(CONTRACTS.STAKING, StakingABI, prov);
      const apybps = await staking.apyBasisPoints();
      setApy((apybps/100).toString()); // bps -> percent (e.g. 2000 -> 20.00)
      if(account){
        const pendingReward = await staking.pendingReward(account);
        setPending(ethers.formatUnits(pendingReward, TOKEN_DECIMALS));
      }
      // faucet cooldown display
      const faucet = new ethers.Contract(CONTRACTS.FAUCET, FaucetABI, prov);
      const cd = await faucet.cooldown();
      setFaucetCooldown(cd.toString());
    }catch(e){ console.error(e); }
  }

  async function doStake(){
    if(!signer) return alert("Connect wallet");
    if(!amount || Number(amount) <= 0) return alert("Enter amount");
    try{
      const token = new ethers.Contract(CONTRACTS.TOKEN, TokenABI, signer);
      const staking = new ethers.Contract(CONTRACTS.STAKING, StakingABI, signer);
      const amt = ethers.parseUnits(amount.toString(), TOKEN_DECIMALS);
      // approve then stake
      const aTx = await token.approve(CONTRACTS.STAKING, amt);
      await aTx.wait();
      const tx = await staking.stake(amt);
      await tx.wait();
      alert("Staked!");
      setAmount("");
      load();
    }catch(e){
      console.error(e);
      alert("Stake failed: " + (e?.message || e));
    }
  }

  async function doUnstake(){
    if(!signer) return alert("Connect wallet");
    if(!amount || Number(amount) <= 0) return alert("Enter amount");
    try{
      const staking = new ethers.Contract(CONTRACTS.STAKING, StakingABI, signer);
      const amt = ethers.parseUnits(amount.toString(), TOKEN_DECIMALS);
      const tx = await staking.unstake(amt);
      await tx.wait();
      alert("Unstaked!");
      setAmount("");
      load();
    }catch(e){
      console.error(e);
      alert("Unstake failed");
    }
  }

  async function claimRewards(){
    if(!signer) return alert("Connect wallet");
    try{
      const staking = new ethers.Contract(CONTRACTS.STAKING, StakingABI, signer);
      const tx = await staking.claimReward();
      await tx.wait();
      alert("Rewards claimed!");
      load();
    }catch(e){
      console.error(e);
      alert("Claim failed");
    }
  }

  async function claimFaucet(){
    if(!signer) return alert("Connect wallet");
    try{
      const faucet = new ethers.Contract(CONTRACTS.FAUCET, FaucetABI, signer);
      const tx = await faucet.claim();
      await tx.wait();
      alert("Faucet claimed!");
      load();
    }catch(e){
      console.error(e);
      alert("Claim faucet failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">Staking & Faucet</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Stake</h3>
          <p>APY: <strong>{apy}%</strong></p>
          <input className="border p-2 mt-2 w-full" placeholder="Amount PWKC" value={amount} onChange={e=>setAmount(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button onClick={doStake} className="bg-green-500 text-white px-3 py-1 rounded">Stake</button>
            <button onClick={doUnstake} className="bg-red-500 text-white px-3 py-1 rounded">Withdraw (Unstake)</button>
          </div>
          <div className="mt-3">
            <p>Pending reward: <strong>{pending} PWKC</strong></p>
            <button onClick={claimRewards} className="bg-purple-600 text-white px-3 py-1 rounded mt-2">Claim Rewards</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Faucet</h3>
          <p>Faucet cooldown (seconds): <strong>{faucetCooldown ?? "loading..."}</strong></p>
          <button onClick={claimFaucet} className="bg-blue-500 text-white px-3 py-1 rounded mt-3">Claim Faucet</button>
        </div>
      </div>
    </div>
  );
}