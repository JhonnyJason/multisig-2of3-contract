var MultiSigSimple = artifacts.require("MultiSigSimple");
var MultiSigSingleTransaction = artifacts.require("MultiSigSingleTransaction")

module.exports = function(deployer) {
    deployer.deploy(MultiSigSimple)
    deployer.deploy(MultiSigSingleTransaction)
};
