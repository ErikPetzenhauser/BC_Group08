async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy InsurancePolicyContract
  const InsurancePolicyContractFactory = await ethers.getContractFactory("InsurancePolicyContract");
  const insurancePolicyContract = await InsurancePolicyContractFactory.deploy();
  await insurancePolicyContract.waitForDeployment();
  const insurancePolicyContractAddress = await insurancePolicyContract.getAddress();
  console.log("InsurancePolicyContract deployed to:", insurancePolicyContractAddress);

  // Deploy ClaimContract with the address of the deployed InsurancePolicyContract
  const ClaimContractFactory = await ethers.getContractFactory("ClaimContract");
  const claimContract = await ClaimContractFactory.deploy(insurancePolicyContractAddress);
  await claimContract.waitForDeployment();
  const claimContractAddress = await claimContract.getAddress();
  console.log("ClaimContract deployed to:", claimContractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
