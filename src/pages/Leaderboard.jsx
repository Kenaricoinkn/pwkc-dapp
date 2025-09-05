import React, {useState, useEffect} from "react";
import { ethers } from "ethers";
import { CONTRACTS, TOKEN_DECIMALS } from "../config";
import StakingABI from "../abi/PWKCStaking.json";

export default function Leaderboard({ provider }) {
  const [leaders, setLeaders] = useState([]);

  useEffect(()=>{ load(); }, [provider]);

  async function load(){
    try{
      const prov = provider ?? new ethers.BrowserProvider(window.ethereum);
      const staking = new ethers.Contract(CONTRACTS.STAKING, StakingABI, prov);
      const list = await staking.getLeaderboard();
      // map to display stake amounts
      const rows = await Promise.all(list.map(async (addr) => {
        const s = await staking.stakes(addr);
        return { address: addr, staked: ethers.formatUnits(s[0].toString(), TOKEN_DECIMALS) };
      }));
      setLeaders(rows);
    }catch(e){
      console.error(e);
      setLeaders([]);
    }
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">Leaderboard</h2>
      <div className="bg-white p-4 rounded shadow">
        {leaders.length===0 ? <p>No data or connect wallet</p> :
          <ol className="list-decimal pl-6">
            {leaders.map((r, i) => (
              <li key={r.address} className="mb-2">
                <div><strong>{r.address}</strong></div>
                <div>Staked: {r.staked} PWKC</div>
              </li>
            ))}
          </ol>
        }
      </div>
    </div>
  );
}