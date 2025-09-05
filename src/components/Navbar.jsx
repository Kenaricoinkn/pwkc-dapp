import React, {useState} from "react";

export default function Navbar({ page, setPage, account, connectWallet, chainId, switchToBSC }) {
  const [open, setOpen] = useState(false);
  function short(a){
    if(!a) return "";
    return a.slice(0,6) + "..." + a.slice(-4);
  }
  return (
    <nav className="bg-slate-900 text-white p-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2" onClick={()=>setOpen(!open)}>☰</button>
          <div className="text-lg font-semibold">PurwakartaChain Dashboard</div>
        </div>

        <div className={`mt-3 md:mt-0 ${open ? "block" : "hidden"} md:block`}>
          <ul className="flex flex-col md:flex-row md:gap-6">
            <li className={`cursor-pointer ${page==="home"?"text-green-300":""}`} onClick={()=>{setPage("home"); setOpen(false);}}>Home</li>
            <li className={`cursor-pointer ${page==="leaderboard"?"text-green-300":""}`} onClick={()=>{setPage("leaderboard"); setOpen(false);}}>Leaderboard</li>
            <li className={`cursor-pointer ${page==="staking"?"text-green-300":""}`} onClick={()=>{setPage("staking"); setOpen(false);}}>Staking / Faucet</li>
            <li className={`cursor-pointer ${page==="nft"?"text-green-300":""}`} onClick={()=>{setPage("nft"); setOpen(false);}}>Mint NFT</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          {chainId !== 56 && chainId !== 97 ? (
            <button onClick={() => switchToBSC(56)} className="bg-yellow-500 text-black px-3 py-1 rounded">Switch to BSC</button>
          ) : null}
          {account ? (
            <div className="bg-slate-800 px-3 py-1 rounded">{short(account)}</div>
          ) : (
            <button onClick={connectWallet} className="bg-blue-500 px-3 py-1 rounded">Connect Wallet</button>
          )}
        </div>
      </div>
    </nav>
  );
}