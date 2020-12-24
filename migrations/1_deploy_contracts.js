var MultiSig2of3 = artifacts.require("MultiSig2of3");

module.exports = function(deployer, network, accounts) {
    var allWallets = accounts.slice(0,3)
    deployer.deploy(MultiSig2of3, allWallets)
};
