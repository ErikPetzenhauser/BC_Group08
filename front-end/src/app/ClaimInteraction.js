import React, { useState, useEffect } from "react";
import claimContractArtifact from "../../../hardhat-deployment/artifacts/contracts/ClaimContract.sol/ClaimContract.json";

const claimAbi = claimContractArtifact.abi;

const ClaimInteraction = ({ contractAddress, web3, isConnected, userAddress, setReviewStatus, reviewStatus }) => {
  const [claimDetails, setClaimDetails] = useState(null);
  const [claimId, setClaimId] = useState(""); // Add claimId state
  const [inputClaimId, setInputClaimId] = useState(""); // Separate input state

  useEffect(() => {
    if (isConnected && web3 && contractAddress && claimId !== "") {
      const claimContract = new web3.eth.Contract(claimAbi, contractAddress);

      const fetchClaimDetails = async () => {
        try {
          const details = await claimContract.methods.getClaim(claimId).call();
          setClaimDetails(details);
        } catch (error) {
          console.error("Error fetching claim details:", error);
        }
      };

      fetchClaimDetails();
    }
  }, [isConnected, web3, contractAddress, claimId]); // Add claimId as a dependency

  const handleClaimIdChange = (event) => {
    setInputClaimId(event.target.value);
  };

  const handleSearchClaim = () => {
    setClaimId(inputClaimId);
  };

  const reviewClaim = async (approve) => {
    if (!web3 || !contractAddress) return;
    const claimContract = new web3.eth.Contract(claimAbi, contractAddress);
    const gasPrice = await web3.eth.getGasPrice(); // Fetch the current gas price
    try {
      await claimContract.methods.reviewClaim(claimId, approve).send({ 
        from: userAddress,
        gasPrice: gasPrice // Use gasPrice for compatibility with non-EIP-1559 networks
      });
      setReviewStatus(approve ? "Approved" : "Rejected");
      // Fetch updated claim details to reflect the new status
      const updatedDetails = await claimContract.methods.getClaim(claimId).call();
      setClaimDetails(updatedDetails);
    } catch (error) {
      console.error("Error reviewing claim:", error);
    }
  };  

  if (!isConnected) {
    return <div>Please connect to MetaMask to view claim details.</div>;
  }

  return (
    <div>
      <input 
        type="number" 
        placeholder="Enter Claim ID" 
        value={inputClaimId}
        onChange={handleClaimIdChange}
        style={{ width: '300px', padding: '10px', fontSize: '16px' }}
      />
      <button 
        onClick={handleSearchClaim} 
        style={{ padding: '10px 20px', marginLeft: '10px' }}
      >Search Claim</button>

      {claimDetails ? (
        claimDetails.claimant === '0x0000000000000000000000000000000000000000' ? (
          <div>Claim doesn't exist</div>
        ) : (
          <div>
            <h3>Claim Details:</h3>
            <p>Claimant: {claimDetails.claimant.toString()}</p>
            <p>Description: {claimDetails.description}</p>
            <p>Amount: {claimDetails.amount.toString()}</p>
            <p>Status: {
              claimDetails.status.toString() === "0" ? "Submitted" : 
              claimDetails.status.toString() === "1" ? "Under Review" : 
              claimDetails.status.toString() === "2" ? "Approved" : "Rejected"
            }</p>
            <p>Policy ID: {claimDetails.policyId}</p>
            <button onClick={() => reviewClaim(true)}>Approve</button>
            <button onClick={() => reviewClaim(false)}>Reject</button>
            {reviewStatus && <p>Review Status: {reviewStatus}</p>}
          </div>
        )
      ) : (
        claimId && <div>Loading claim details...</div>
      )}
    </div>
  );
};

export default ClaimInteraction;
