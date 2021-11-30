import { useQuery } from "@apollo/react-hooks";
// import { Contract } from "@ethersproject/contracts";
// import { getDefaultProvider } from "@ethersproject/providers";
import React, { useEffect, useState } from "react";

import { Body, Button, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

// import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

import SuperfluidSDK from "@superfluid-finance/js-sdk";
import { Web3Provider } from "@ethersproject/providers";

// async function readOnChainData() {
//   // Should replace with the end-user wallet, e.g. Metamask
//   const defaultProvider = getDefaultProvider();
//   // Create an instance of an ethers.js Contract
//   // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/
//   const ceaErc20 = new Contract(addresses.ceaErc20, abis.erc20, defaultProvider);
//   // A pre-defined address that owns some CEAERC20 tokens
//   const tokenBalance = await ceaErc20.balanceOf("0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C");
//   console.log({ tokenBalance: tokenBalance.toString() });
// }
// import {
//   BatchOperation
// } from "@superfluid-finance/ethereum-contracts";
import { toWad, toBN } from "@decentral.ee/web3-helpers";
const feeAddress = "0xF538b8d65C4ae4D09503A0F06F38486019750Aa4";
// const payAddress = "0x165a26628AC843e97f657e648b004226FBb7F7C5";
const tokenAddress = "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00"; // sf.tokens.fDAIx.address
const feeFlowRate = toWad(10).div(toBN(3600 * 24 * 30));
// [
//   {
//    "code": BatchOperation.OPERATION_TYPE_SUPERFLUID_CALL_AGREEMENT,
//    "method": "createFlow",
//    "token": "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
//    "receiver": "0xF538b8d65C4ae4D09503A0F06F38486019750Aa4",
//    "flowRate": "10000000000000",
//    "ctx": "",
//    "userData": ""
//   },
//    "code": 201,
//    "method": "createFlow",
//    "token": "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
//    "receiver": "0x165a26628AC843e97f657e648b004226FBb7F7C5",
//    "flowRate": "10000000000000",
//    "ctx": "",
//    "userData": ""
//   },
//  ]
// [
//   {
//    "code": 201,
//    "method": "deleteFlow",
//    "token": "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
//    "sender": "0x9C040e2d6Fd83A8b35069aa7154b69674961e0F7",
//    "receiver": "0x165a26628AC843e97f657e648b004226FBb7F7C5",
//    "ctx": "0x",
//    "userData": "0x"
//   },
//   {
//    "code": 201,
//    "method": "deleteFlow",
//    "token": "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
//    "sender": "0x9C040e2d6Fd83A8b35069aa7154b69674961e0F7",
//    "receiver": "0xF538b8d65C4ae4D09503A0F06F38486019750Aa4",
//    "ctx": "0x",
//    "userData": "0x"
//   }
//  ]
async function setupSF() {
  const sf = new SuperfluidSDK.Framework({
    ethers: new Web3Provider(window.ethereum)
  });
  await sf.initialize()

  const walletAddress = await window.ethereum.request({
    method: 'eth_requestAccounts',
    params: [
      {
        eth_accounts: {}
      }
    ]
  });
      
  const carol = sf.user({
      address: walletAddress[0],
      token: '0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00'
  });
  var details = await carol.details();
  console.log(details);

  await sf.host.batchCall([
    201,
    sf.agreements.cfa.address,
    sf.eth.abi.encodeParameters(
        ["bytes", "bytes"],
        [
            sf.agreements.cfa.contract.methods
                .createFlow(
                  tokenAddress,
                  feeAddress,
                  feeFlowRate.toString(),
                    "0x"
                )
                .encodeABI(), // callData
            "0x" // userData
        ]
      )
    ],
  )

  // await carol.flow({
  //   recipient: '0xF538b8d65C4ae4D09503A0F06F38486019750Aa4',
  //   flowRate: '385802469135802'
  // });
  // details = await carol.details();
  // console.log(details);

  // await carol.flow({
  //   recipient: '0xF538b8d65C4ae4D09503A0F06F38486019750Aa4',
  //   flowRate: '10000000000000' // 25.92 DAIx per month
  // });
  // details = await carol.details();
  // console.log(details);
  
  // await carol.flow({
  //   recipient: '0xF538b8d65C4ae4D09503A0F06F38486019750Aa4',
  //   flowRate: '0' 
  // });
  details = await carol.details();
  console.log(details);
}

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");

  useEffect(() => {
    async function fetchAccount() {
      try {
        if (!provider) {
          return;
        }

        // Load the user's accounts.
        const accounts = await provider.listAccounts();
        setAccount(accounts[0]);

        // Resolve the ENS name for the first account.
        const name = await provider.lookupAddress(accounts[0]);

        // Render either the ENS name or the shortened account address.
        if (name) {
          setRendered(name);
        } else {
          setRendered(account.substring(0, 6) + "..." + account.substring(36));
        }
      } catch (err) {
        setAccount("");
        setRendered("");
        console.error(err);
      }
    }
    fetchAccount();
  }, [account, provider, setAccount, setRendered]);

  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {rendered === "" && "Connect Wallet"}
      {rendered !== "" && rendered}
    </Button>
  );
}

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <Body>
        <Image src={logo} alt="react-logo" />
        <p>
          Edit <code>packages/react-app/src/App.js</code> and save to reload.
        </p>
        {/* Remove the "hidden" prop and open the JavaScript console in the browser to see what this function does */}
        <Button onClick={() => setupSF()}>
          Setup SuperFluid
        </Button>
        <Link href="https://ethereum.org/developers/#getting-started" style={{ marginTop: "8px" }}>
          Learn Ethereum
        </Link>
        <Link href="https://reactjs.org">Learn React</Link>
        <Link href="https://thegraph.com/docs/quick-start">Learn The Graph</Link>
      </Body>
    </div>
  );
}

export default App;
