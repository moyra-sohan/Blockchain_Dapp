import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const SEPOLIA_CHAIN_ID = 11155111;

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [chainId, setChainId] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function getProvider() {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask first."
      );
    }

    return new ethers.BrowserProvider(window.ethereum);
  }

  async function loadWalletData() {
    try {
      const provider = await getProvider();

      const accounts = await provider.send("eth_accounts", []);

      if (accounts.length === 0) {
        setWalletAddress("");
        setBalance("");
        setChainId("");
        return;
      }

      const address = accounts[0];

      const network = await provider.getNetwork();
      const balanceWei = await provider.getBalance(address);

      setWalletAddress(address);
      setBalance(ethers.formatEther(balanceWei));
      setChainId(Number(network.chainId));
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to load wallet data.");
    }
  }

  async function connectWallet() {
    setConnecting(true);
    setError("");

    try {
      const provider = await getProvider();

      await provider.send("eth_requestAccounts", []);

      await loadWalletData();
    } catch (error) {
      console.error(error);

      if (error.code === 4001) {
        setError("You rejected the MetaMask connection request.");
      } else {
        setError(error.message || "Unable to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  }

  async function switchToSepolia() {
    setError("");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0xaa36a7",
          },
        ],
      });

      await loadWalletData();
    } catch (error) {
      console.error(error);

      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia",
                nativeCurrency: {
                  name: "Sepolia Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [
                  "https://ethereum-sepolia-rpc.publicnode.com",
                ],
                blockExplorerUrls: [
                  "https://sepolia.etherscan.io",
                ],
              },
            ],
          });

          await loadWalletData();
        } catch (addError) {
          console.error(addError);
          setError(
            addError.message || "Unable to add Sepolia network."
          );
        }
      } else {
        setError(
          error.message || "Unable to switch to Sepolia."
        );
      }
    }
  }

  function disconnectWallet() {
    setWalletAddress("");
    setBalance("");
    setChainId("");
    setError("");
  }

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    loadWalletData();

    const handleAccountsChanged = () => {
      loadWalletData();
    };

    const handleChainChanged = () => {
      loadWalletData();
    };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  function shortenAddress(address) {
    if (!address) return "";

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  const isSepolia = Number(chainId) === SEPOLIA_CHAIN_ID;

  return (
    <div className="app">
      <header>
        <h1>My First DApp</h1>
        <p>React + Vite + ethers.js</p>
      </header>

      <main>
        {!walletAddress ? (
          <section className="connect-section">
            <h2>Welcome</h2>

            <p>
              Connect your MetaMask wallet to continue.
            </p>

            <button
              type="button"
              onClick={connectWallet}
              disabled={connecting}
            >
              {connecting
                ? "Connecting..."
                : "Connect Wallet"}
            </button>
          </section>
        ) : (
          <section className="wallet-card">
            <h2>Wallet Connected</h2>

            <div className="info-row">
              <span className="label">Address</span>

              <span className="value">
                {shortenAddress(walletAddress)}
              </span>
            </div>

            <div className="info-row">
              <span className="label">
                Full Address
              </span>

              <span className="value full-address">
                {walletAddress}
              </span>
            </div>

            <div className="info-row">
              <span className="label">
                Sepolia ETH Balance
              </span>

              <span className="value">
                {Number(balance).toFixed(6)} ETH
              </span>
            </div>

            <div className="info-row">
              <span className="label">
                Chain ID
              </span>

              <span className="value">
                {chainId}
              </span>
            </div>

            {!isSepolia && (
              <div className="network-warning">
                <p>
                  ⚠️ You are not connected to Sepolia.
                </p>

                <button
                  type="button"
                  onClick={switchToSepolia}
                >
                  Switch to Sepolia
                </button>
              </div>
            )}

            {isSepolia && (
              <p className="success">
                ✓ Connected to Sepolia
              </p>
            )}

            <button
              type="button"
              onClick={disconnectWallet}
            >
              Clear Connection
            </button>
          </section>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

export default App;