"use client";

import React, { useEffect, useState } from "react";
import Web3 from "web3";
import styles from "./page.module.css";
import Image from "next/image";
import ClaimInteraction from "./ClaimInteraction";
import claimContractArtifact from "../../../hardhat-deployment/artifacts/contracts/ClaimContract.sol/ClaimContract.json";
import insurancePolicyContractArtifact from "../../../hardhat-deployment/artifacts/contracts/InsurancePolicyContract.sol/InsurancePolicyContract.json";

const claimContractAddress = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const insurancePolicyContractAddress = process.env.NEXT_PUBLIC_INSURANCE_POLICY_CONTRACT_ADDRESS;

export default function Home() {
  const [web3, setWeb3] = useState(null);
  const [claimContract, setClaimContract] = useState(null);
  const [insurancePolicyContract, setInsurancePolicyContract] = useState(null);
  const [claimCount, setClaimCount] = useState(0);
  const [policyCount, setPolicyCount] = useState(0);
  const [deployedClaims, setDeployedClaims] = useState([]);
  const [deployedPolicies, setDeployedPolicies] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [policyDetails, setPolicyDetails] = useState("");
  const [policyPremium, setPolicyPremium] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [coverageLimit, setCoverageLimit] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [reviewStatus, setReviewStatus] = useState(null);


  const connectMetaMask = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // Initialize your ClaimContract
        const claimContractABI = claimContractArtifact.abi;
        const claimContractInstance = new web3Instance.eth.Contract(
          claimContractABI,
          claimContractAddress
        );
        // Initialize your InsurancePolicyContract
        const insurancePolicyContractABI = insurancePolicyContractArtifact.abi;
        const insurancePolicyContractInstance = new web3Instance.eth.Contract(
          insurancePolicyContractABI,
          insurancePolicyContractAddress
        );
        setWeb3(web3Instance);
        setClaimContract(claimContractInstance);
        setInsurancePolicyContract(insurancePolicyContractInstance);
        setIsConnected(true);
        const accounts = await web3Instance.eth.getAccounts();
        setUserAddress(accounts[0]);
        console.log("Connected to MetaMask!", accounts[0]);
      } catch (error) {
        console.error("User denied account access or an error occurred:", error);
      }
    } else {
      console.log("MetaMask not found. Please install MetaMask to connect.");
    }
  };

  const handleConnectButtonClick = () => {
    connectMetaMask();
    setIsConnected(true); // Update isConnected state when connected
  };

  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        if (window.ethereum) {
          await connectMetaMask();
        } else {
          console.log("MetaMask not found. Please install MetaMask to connect.");
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Error initializing web3:", error);
      }
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      const accounts = await web3Instance.eth.getAccounts();
      setUserAddress(accounts[0]); // Assuming the first account is the user's address
      setIsConnected(true);
    };

    initializeWeb3();
  }, []);

  useEffect(() => {
    if (claimContract) {
      getClaimCount();
      getDeployedClaims();
    }
    if (insurancePolicyContract) {
      getPolicyCount();
      getDeployedPolicies();
    }
  }, [claimContract, insurancePolicyContract]);

  const getClaimCount = async () => {
    if (!claimContract) return;
  
    try {
      const count = await claimContract.methods.getClaimCount().call();
      setClaimCount(count);
      console.log("Claim count:", count);
    } catch (error) {
      console.error("Error fetching claim count:", error);
    }
  };  

  const getDeployedClaims = async () => {
    if (!claimContract) return;

    try {
        // Clear old claims
        setDeployedClaims([]);
        
        // Fetch deployed claims
        const claims = await claimContract.methods.getAllClaims().call();
        console.log("Deployed Claims:", claims);
        
        // Filter out phantom claims
        const filteredClaims = claims.filter(claim => claim.claimant.toString() !== '0x0000000000000000000000000000000000000000');
        setDeployedClaims(filteredClaims);
    } catch (error) {
        console.error("Error fetching deployed claims:", error);
    }
  };

  const getPolicyCount = async () => {
    if (!insurancePolicyContract) return;

    try {
      const count = await insurancePolicyContract.methods.getPolicyCount().call();
      setPolicyCount(count);
      console.log("Policy count:", count);
    } catch (error) {
      console.error("Error fetching policy count:", error);
    }
  };

  // Function to get deployed policies and filter out phantom policies
  const getDeployedPolicies = async () => {
    if (!insurancePolicyContract) return;

    try {
        const policies = await insurancePolicyContract.methods.getAllPolicies().call();
        console.log("Deployed Policies:", policies);
        const filteredPolicies = policies.filter(policy => policy.policyHolder.toString() !== '0x0000000000000000000000000000000000000000');
        setDeployedPolicies(filteredPolicies);
    } catch (error) {
        console.error("Error fetching deployed policies:", error);
    }
  };

  useEffect(() => {
    if (claimContract) {
      getClaimCount();
      getDeployedClaims();
    }
    if (insurancePolicyContract) {
      getPolicyCount();
      getDeployedPolicies();
    }
  }, [claimContract, insurancePolicyContract]);

  const handleRefreshButtonClick = () => {
    getDeployedClaims();
    getDeployedPolicies();
    window.location.reload(); // Reload the page after fetching deployed claims and policies
  };

  const createClaim = async (e) => {
    e.preventDefault();
    if (!claimContract || !insurancePolicyContract) return;
    console.log("Creating claim with amount:", claimAmount); // For testing
    try {
        const gasPrice = await web3.eth.getGasPrice(); // Fetch the current gas price

        await claimContract.methods
            .submitClaim(selectedPolicyId, claimDescription, claimAmount)
            .send({
                from: userAddress,
                gasPrice: gasPrice // Use gasPrice for compatibility with non-EIP-1559 networks
            });
        console.log("Claim created successfully!");
        getDeployedClaims(); // Refresh claims after submission
    } catch (error) {
        console.error("Error creating claim:", error);
        if (error.message.includes("Claim amount exceeds policy coverage limit")) {
            alert("Error: Claim amount exceeds policy coverage limit");
        } else if (error.message.includes("The policy is no longer valid")) {
            alert("Error: The policy is no longer valid");
        } else if (error.message.includes("You must own the policy to submit a claim")) {
            alert("Error: You must own the policy to submit a claim");
        } else {
            alert("Error creating claim. Claim amount probably exceeds policy coverage limit.");
        }
    }
  };

  const removeClaim = async (claimId) => {
    if (!claimContract) return;

    try {
      const gasPrice = await web3.eth.getGasPrice();
      await claimContract.methods.removeClaim(claimId).send({
        from: userAddress,
        gasPrice: gasPrice
      });
      console.log("Claim removed successfully!");
      getDeployedClaims(); // Refresh the list of claims after removal
    } catch (error) {
      console.error("Error removing claim:", error);
    }
  };

  const createPolicy = async () => {
    if (!insurancePolicyContract) return;
    const gasPrice = await web3.eth.getGasPrice(); // Fetch the current gas price
    try {
      await insurancePolicyContract.methods
        .issuePolicy(policyDetails, policyPremium, coverageLimit, validUntil)
        .send({
          from: userAddress,
          gasPrice: gasPrice // Use gasPrice for compatibility with non-EIP-1559 networks
        });
      console.log("Policy created successfully!");
    } catch (error) {
      console.error("Error creating policy:", error);
    }
    window.location.reload();
  };

  const removePolicy = async (policyId) => {
    if (!insurancePolicyContract) return;

    try {
        const gasPrice = await web3.eth.getGasPrice();
        await insurancePolicyContract.methods.removePolicy(policyId).send({
            from: userAddress,
            gasPrice: gasPrice
        });
        console.log("Policy removed successfully!");
        getDeployedPolicies(); // Refresh the list of policies after removal
    } catch (error) {
        console.error("Error removing policy:", error);
    }
  };

  const truncateAddress = (address) => {
    const start = address.substring(0, 7);
    const end = address.substring(address.length - 4, address.length);
    return `${start}...${end}`;
  };

  return (
    <main className={styles.main}>
      {/* App Title */}
      <div className={styles.title}>
        <h1>Decentralized Insurance Claim Management System</h1>
      </div>

      {/* MetaMask connection button */}
      <button className={styles.card} onClick={handleConnectButtonClick}>
        {!isConnected ? (
          <>
            <h2
              style={{
                background: "rgba(var(--color-connect-button-not-connected), 100)",
                border: "1px solid rgba(var(--card-border-rgb), 100)",
                borderRadius: "12px",
              }}
            >
              Connect MetaMask
            </h2>
            <p>Click here to connect your MetaMask wallet</p>
          </>
        ) : (
          <>
            <h2
              style={{
                background: "rgba(var(--color-connect-button-connected), 100)",
                border: "1px solid rgba(var(--card-border-rgb), 100)",
                borderRadius: "12px",
              }}
            >
              Connected to MetaMask!
            </h2>
            <p>Account:</p>
            <p style={{ wordBreak: "break-all" }}>
              <strong>{userAddress}</strong>
            </p>
          </>
        )}
      </button>

      <ClaimInteraction 
        contractAddress={claimContractAddress} 
        web3={web3} 
        isConnected={isConnected} 
        userAddress={userAddress}
        setReviewStatus={setReviewStatus} 
        reviewStatus={reviewStatus} 
        updateClaims={getDeployedClaims}
      />

      {/* Grid for claim and policy-related actions */}
      <div className={styles.grid}>
        {/* Get total claim count */}
        <div className={styles.card} onClick={getClaimCount}>
          <h4 style={{ textAlign: "center" }}>
            Total Claim Count: <strong>{claimCount.toString()}</strong>{" "}
            <span>&#x1F4B0;</span>
          </h4>
        </div>

        {/* Button to refresh deployed claims and policies */}
        <button className={styles.card} onClick={handleRefreshButtonClick}>
          <h2>
            Refresh <span>&#x21BA;</span>
          </h2>
        </button>

        {/* Form to submit a new claim */}
        <div className={styles.card}>
          <h2>Submit Claim:</h2>
          <form onSubmit={createClaim}>
            <input
              type="number"
              placeholder="Policy ID"
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={claimDescription}
              onChange={(e) => setClaimDescription(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Amount (wei)"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              required
            />
            <button type="submit">Submit Claim <span>&#x1F680;</span></button>
          </form>
        </div>

        {/* Form to issue a new policy */}
        <div className={styles.card}>
          <h2>Issue Policy:</h2>
          <input 
            type="text" 
            placeholder="Policy Details" 
            value={policyDetails} 
            onChange={(e) => setPolicyDetails(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Premium (wei)" 
            value={policyPremium} 
            onChange={(e) => setPolicyPremium(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Coverage Limit (wei)" 
            value={coverageLimit} 
            onChange={(e) => setCoverageLimit(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Valid Until (timestamp)" 
            value={validUntil} 
            onChange={(e) => setValidUntil(e.target.value)} 
          />
          <button onClick={createPolicy}>Issue Policy <span>&#x1F4C4;</span></button>
        </div>
      </div>

      {/* Display deployed claims */}
      <div className={styles.grid}>
        {deployedClaims.map((claim, index) => (
          claim.claimant !== '0x0000000000000000000000000000000000000000' && (
            <div className={styles.card} key={index}>
              <h3>
                Claim id: {index} <span>&#x1F4C4;</span>
              </h3>
              <p>{truncateAddress(claim.claimant)}</p>

              <hr />

              <div>
                <h5>Claim Description:</h5>
                <p>{claim.description}</p>
                <h5>Claim Amount:</h5>
                <p>{claim.amount.toString()}</p>
                <h5>Policy ID:</h5>
                <p>{claim.policyId.toString()}</p>
                <h5>Claim Status:</h5>
                  <p>{
                    claim.status.toString() === "0" ? "Submitted" : 
                    claim.status.toString() === "1" ? "Under Review" : 
                    claim.status.toString() === "2" ? "Approved" : "Rejected"
                }</p>
              </div>

              <hr />
              <div>
                <h5>Full Contract Instance address:</h5>
                <p style={{ wordBreak: "break-all" }}>{claimContractAddress}</p>
              </div>

              <button onClick={() => removeClaim(claim.id)}>Remove Claim</button>
            </div>
          )
        ))}
      </div>

      <div className={styles.grid}>
        {deployedPolicies.map((policy, index) => (
            <div className={styles.card} key={index}>
                <h3>
                    Policy id: {policy.id.toString()} <span>&#x1F4C4;</span>
                </h3>
                <p>Policy Holder: {truncateAddress(policy.policyHolder)}</p>
                <p>Policy Details: {policy.policyDetails}</p>
                <p>Premium: {policy.premium.toString()} wei</p>
                <p>Coverage Limit: {policy.coverageLimit.toString()} wei</p>
                <p>Valid Until: {new Date(Number(policy.validUntil.toString()) * 1000).toLocaleString()}</p> {/* Convert BigInt to number */}
                <hr />
                <div>
                    <h5>Full Contract Instance address:</h5>
                    <p style={{ wordBreak: "break-all" }}>{insurancePolicyContractAddress}</p>
                </div>
                <button onClick={() => removePolicy(policy.id)}>Remove Policy</button>
            </div>
        ))}
    </div>

    {/* Display review status */}
    {reviewStatus && <p>Review Status: {reviewStatus}</p>}
    </main>
  );
}
