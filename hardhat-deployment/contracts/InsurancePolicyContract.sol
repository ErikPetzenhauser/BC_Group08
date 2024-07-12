// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InsurancePolicyContract {
    struct Policy {
        uint256 id;
        address policyHolder;
        string policyDetails;
        uint256 premium;
        uint256 coverageLimit; // Maximum amount that can be claimed
        uint256 validUntil; // Unix timestamp until which the policy is valid
    }
    
    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId;
    
    function issuePolicy(string memory policyDetails, uint256 premium, uint256 coverageLimit, uint256 validUntil) public {
        policies[nextPolicyId] = Policy(nextPolicyId, msg.sender, policyDetails, premium, coverageLimit, validUntil);
        nextPolicyId++;
    }
    
    function getPolicy(uint256 policyId) public view returns (Policy memory) {
        return policies[policyId];
    }

    function removePolicy(uint256 policyId) public {
        require(policies[policyId].policyHolder == msg.sender, "Only the policy holder can remove this policy.");
        delete policies[policyId];
    }

    function getPolicyCount() public view returns (uint256) {
        return nextPolicyId;
    }
    
    function getAllPolicies() public view returns (Policy[] memory) {
        Policy[] memory allPolicies = new Policy[](nextPolicyId);
        for (uint256 i = 0; i < nextPolicyId; i++) {
            allPolicies[i] = policies[i];
        }
        return allPolicies;
    }
}
