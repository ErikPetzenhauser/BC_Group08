// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InsurancePolicyContract.sol";

contract ClaimContract {
    enum ClaimStatus { Submitted, UnderReview, Approved, Rejected }
    
    struct Claim {
        uint256 id;
        address claimant;
        string description;
        uint256 amount;
        ClaimStatus status;
        uint256 policyId; // Reference to the policy
    }
    
    mapping(uint256 => Claim) public claims;
    uint256 public nextClaimId;

    InsurancePolicyContract policyContract;

    constructor(address policyContractAddress) {
        policyContract = InsurancePolicyContract(policyContractAddress);
    }
        
    function submitClaim(uint256 policyId, string memory description, uint256 amount) public {
        // Ensure the policy exists and is owned by the claimant
        InsurancePolicyContract.Policy memory policy = policyContract.getPolicy(policyId);
        require(policy.policyHolder == msg.sender, "You must own the policy to submit a claim");
        require(policy.validUntil >= block.timestamp, "The policy is no longer valid");
        require(amount <= policy.coverageLimit, "Claim amount exceeds policy coverage limit");

        claims[nextClaimId] = Claim(nextClaimId, msg.sender, description, amount, ClaimStatus.Submitted, policyId);
        emit ClaimSubmitted(nextClaimId, msg.sender, policyId, description, amount);
        nextClaimId++;
    }
    
    function reviewClaim(uint256 claimId, bool approve) public {
        require(claims[claimId].status == ClaimStatus.Submitted, "Claim already reviewed");
        claims[claimId].status = approve ? ClaimStatus.Approved : ClaimStatus.Rejected;
        emit ClaimReviewed(claimId, approve);
    }
    
    function getClaim(uint256 claimId) public view returns (Claim memory) {
        return claims[claimId];
    }

    function removeClaim(uint256 claimId) public {
        require(claims[claimId].claimant == msg.sender, "Only the claimant can remove this claim.");
        delete claims[claimId];
    }

    function getClaimCount() public view returns (uint256) {
        return nextClaimId;
    }

    function getAllClaims() public view returns (Claim[] memory) {
        Claim[] memory allClaims = new Claim[](nextClaimId);
        for (uint256 i = 0; i < nextClaimId; i++) {
            allClaims[i] = claims[i];
        }
        return allClaims;
    }

    event ClaimSubmitted(uint256 claimId, address claimant, uint256 policyId, string description, uint256 amount);
    event ClaimReviewed(uint256 claimId, bool approved);
}
