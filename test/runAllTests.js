const fs = require("fs")
const MultiSig2of3 = artifacts.require("MultiSig2of3")
const PrivateCounter = artifacts.require("PrivateCounter")

function repairSignatureV(signature) {
    var v = '0x' + signature[130] + signature[131]
    if(v == "0x00") {
        v = "0x1b"
    } else if(v == "0x01") {
        v = "0x1c"
    } else if (v == "0x02") {
        v = "0x1d"
    }
    signature[130] = v[2]
    signature[131] = v[3]
    signature = signature.slice(0,130) + v.slice(2)
    return signature
}
async function getSignature(message, address) {
    const signature = await web3.eth.sign(message, address)
    return repairSignatureV(signature)
}
function getSignatureParams(signature) {
    var pureSignature = signature.slice(2)

    var v = "0x"+pureSignature.slice(128,130)
    var r = "0x"+pureSignature.slice(0,64)
    var s = "0x"+pureSignature.slice(64,128)

    return {v, r, s}
}

contract("MultiSig2of3", (accounts) => {

    //############################################################
    it("...have all initial wallets.", async () => {
        const c = await MultiSig2of3.deployed()

        const hasAllWallets = await c.hasAllWallets()        
        assert.equal(hasAllWallets, true, "Did not have hasAllWallets being true!")

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        const hasWallet0 = await c.relevantWallets(w0)
        const hasWallet1 = await c.relevantWallets(w1)
        const hasWallet2 = await c.relevantWallets(w2)
        const hasWallet3 = await c.relevantWallets(w3)

        assert.equal(hasWallet0, true, "Wallet 0 was not relevant!")
        assert.equal(hasWallet1, true, "Wallet 1 was not relevant!")
        assert.equal(hasWallet2, true, "Wallet 2 was not relevant!")

        assert.equal(hasWallet3, false, "Wallet 3 was relevant!")
    })
    //############################################################
    it("...not be able to do invalid requests.", async () => {
        const c = await MultiSig2of3.deployed()

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        // sender of signature not matching msg.sender
        // var message = await multiSig.getWalletActionMessage(wallet2, {from: wallet1})
        // var signature0 = await getSignature(message, wallet0)
        // var {v, r, s} = getSignatureParams(signature0)

        // var result = await multiSig.addRelevantWalletSignature(wallet1, signature0)
        // console.log(result.receipt.gasUsed)
        // var result = await multiSig.addRelevantWalletParams(wallet1, vs, rs, ss)
        // console.log(result.receipt.gasUsed)

    })
    //############################################################
    it("...be able to remove a wallet.", async () => {
        const c = await MultiSig2of3.deployed()
        
        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        // remove w2 sent by w1 signed by w0
        var message = await c.getWalletActionMessage(w2, {from:w1})
        var signature0 = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature0)

        var result = await c.removeRelevantWallet(w2, v, r, s,{from:w1})
        console.log(result.receipt.gasUsed)

        const hasAllWallets = await c.hasAllWallets()        
        assert.equal(hasAllWallets, false, "We still have all wallets after removing!")

        const hasWallet0 = await c.relevantWallets(w0)
        const hasWallet1 = await c.relevantWallets(w1)
        const hasWallet2 = await c.relevantWallets(w2)
        const hasWallet3 = await c.relevantWallets(w3)

        assert.equal(hasWallet0, true, "Wallet 0 was not relevant!")
        assert.equal(hasWallet1, true, "Wallet 1 was not relevant!")
        assert.equal(hasWallet2, false, "Wallet 2 was still relevant!")
        assert.equal(hasWallet3, false, "Wallet 3 was relevant!")

    })
    //############################################################
    it("...not be able to do anything without having all wallets.", async () => {
        const c = await MultiSig2of3.deployed()
    })
    //############################################################
    it("...be able to do add a new wallet.", async () => {
        const c = await MultiSig2of3.deployed()

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        // add w3 sent by w1 signed by w0
        var message = await c.getWalletActionMessage(w3, {from:w1})
        var signature0 = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature0)
        
        var result = await c.addRelevantWallet(w3, v, r, s,{from:w1})
        console.log(result.receipt.gasUsed)

        const hasAllWallets = await c.hasAllWallets()        
        assert.equal(hasAllWallets, true, "We still did not have all Wallets!")

        const hasWallet0 = await c.relevantWallets(w0)
        const hasWallet1 = await c.relevantWallets(w1)
        const hasWallet2 = await c.relevantWallets(w2)
        const hasWallet3 = await c.relevantWallets(w3)

        assert.equal(hasWallet0, true, "Wallet 0 was not relevant!")
        assert.equal(hasWallet1, true, "Wallet 1 was not relevant!")
        assert.equal(hasWallet2, false, "Wallet 2 was relevant!")
        assert.equal(hasWallet3, true, "Wallet 3 was still not relevant!")

    })
    //############################################################
    it("...be able to do add a new wallet.", async () => {
        const c = await MultiSig2of3.deployed()
    })
    //############################################################
    it("...not be able to do invalid requests.", async () => {
        const c = await MultiSig2of3.deployed()
    })
    //############################################################
    it("...be able to do send ether.", async () => {
        const c = await MultiSig2of3.deployed()

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]
        
        const receiver = accounts[7]
        const donator = accounts[8]

        const initialReceiverBalance = BigInt(await web3.eth.getBalance(receiver));
        // console.log(initialReceiverBalance.toString())
        const initialContractBalance = BigInt(await web3.eth.getBalance(c.address))
        // console.log(initialContractBalance.toString())

        const amount = BigInt(web3.utils.toWei(web3.utils.toBN(6), "milliether"))

        const desiredReceiverBalance = initialReceiverBalance + amount
        // console.log(desiredReceiverBalance.toString())

        const temporaryContractBalance = initialContractBalance + amount
        // console.log(temporaryContractBalance.toString())
        const finalContractBalance = initialContractBalance

        // first donate ETH to contract
        var donationOptions = {
            from: donator,
            to: c.address,
            value: web3.utils.toBN(amount.toString())
        }

        var result = await web3.eth.sendTransaction(donationOptions)
        console.log(result.gasUsed)

        var currentContractBalance = BigInt(await web3.eth.getBalance(c.address))
        assert.equal(currentContractBalance.toString(), temporaryContractBalance.toString(), "The donation has failed!")

        // sent to receiver by w1 signed by w0
        var message = await c.getSendEtherMessage(amount, {from:w1})
        var signature0 = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature0)
        
        var result = await c.sendEther(receiver, amount, v, r, s,{from:w1})
        console.log(result.receipt.gasUsed)

        // check final balances
        var currentContractBalance = BigInt(await web3.eth.getBalance(c.address))
        assert.equal(currentContractBalance.toString(), finalContractBalance.toString(), "The final contract balance was incorrect!")

        var currentReceiverBalance = BigInt(await web3.eth.getBalance(receiver))
        assert.equal(currentReceiverBalance.toString(), desiredReceiverBalance.toString(), "The receiver did not get the correct amount of ETH!")

    })
    //############################################################
    it("...be able to do an arbitrary transaction.", async () => {
        const c = await MultiSig2of3.deployed()
        const cc = await PrivateCounter.deployed()
        const ccJSON = JSON.parse(fs.readFileSync("./build/contracts/PrivateCounter.json", "utf-8"))
        const web3CC = new web3.eth.Contract(ccJSON.abi, cc.address)

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]
        
        const Iwork = await web3CC.methods.doIwork().call({from:w1, gas:100000000000000000, gasPrice:20000000000})
        console.log(Iwork)

        const ccContractBefore = BigInt(await cc.getPrivateCounts(c.address))
        const ccSenderBefore = BigInt(await cc.getPrivateCounts(w1).call())
        console.log(ccContractBefore.toString())
        console.log(ccSenderBefore.toString())
        const desiredCCSenderAfter = ccSenderBefore
        const desiredCCContractAfter = ccContractBefore + 1n

        const transactionData = web3CC.methods.plusplus().encodeABI()
        console.log(transactionData)

        const addressPadding = "0x000000000000000000000000"
        const transactionOneArg = addressPadding + cc.address.slice(2) + "0000000000000000000000000000000000000000000000000000000000000000" + transactionData.slice(2)

        // sent by w1 signed by w0
        var message = await c.getTransactionMessageB(cc.address, 0, transactionData, {from:w1})
        var signature0 = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature0)
        
        var result = await c.doTransactionB(cc.address, 0, transactionData, v, r, s,{from:w1})
        console.log(result.receipt.gasUsed)


        // const ccContractAfter = BigInt(await cc.getPrivateCounts(c.address))
        // const ccSenderAfter = BigInt(await cc.getPrivateCounts(w1))
        // assert.equal(ccContractAfter,desiredCCContractAfter, "The count of the contract did not increase!")
        // assert.equal(ccSenderAfter, desiredCCSenderAfter, "The senders count did not stay the same!")
    })

})

// contract("MultiSigSimple", (accounts) => {

//     //############################################################
//     //#region ReadOnly Tests
//     // it("...have .", async () => {
//     //     const multiSig = await MultiSigSimple.deployed()

//     //     const wallet0 = accounts[0]
//     //     const wallet1 = accounts[1]
//     //     const wallet2 = accounts[2]
//     //     const wallet3 = accounts[3]

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)
        
//     //     var numberOfwallets = await multiSig.numberOfWallets()
//     //     console.log(numberOfwallets.toNumber())

//     //     console.log("approve Wallet add from wallet")
//     //     var result = await multiSig.approveWalletAdd(wallet1, {from: wallet0})
//     //     console.log(result.receipt.gasUsed)


//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)
        
//     //     var numberOfwallets = await multiSig.numberOfWallets()
//     //     console.log(numberOfwallets.toNumber())

//     //     console.log("approve Wallet add from first wallet")
//     //     var result = await multiSig.approveWalletAdd(wallet2, {from: wallet0})
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)
        
//     //     var numberOfwallets = await multiSig.numberOfWallets()
//     //     console.log(numberOfwallets.toNumber())


//     //     console.log("approve incorrect Wallet add from second wallet")
//     //     try {
//     //         result = await multiSig.approveWalletAdd(wallet3, {from: wallet1})
//     //         console.log(result.receipt.gasUsed)
//     //     } catch(err) {
//     //         console.log(err)
//     //     }

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)
        
//     //     var numberOfwallets = await multiSig.numberOfWallets()
//     //     console.log(numberOfwallets.toNumber())


//     //     console.log("approve Wallet add from second wallet")
//     //     var result = await multiSig.approveWalletAdd(wallet2, {from: wallet1})
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)
        
//     //     var numberOfwallets = await multiSig.numberOfWallets()
//     //     console.log(numberOfwallets.toNumber())

//     // })


//     //#endregion

//     //############################################################
//     //#region ReadOnly Tests
//     // it("...have added a wallet in a tedious process.", async () => {
//     //     const multiSig = await MultiSigSimple.deployed()

//     //     const wallet0 = accounts[0]
//     //     const wallet1 = accounts[1]

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)

//     //     var result = await multiSig.suggestWalletAdd(wallet1)
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)


//     //     var result = await multiSig.approveWalletAdd(wallet1)
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)

//     //     var result = await multiSig.executeWalletAdd(wallet1)
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)

//     // })

//     // it("...have added First Wallet in a Single transaction.", async () => {
//     //     const multiSig = await MultiSigSimple.deployed()

//     //     const wallet0 = accounts[0]
//     //     const wallet1 = accounts[1]
//     //     const wallet2 = accounts[2]

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)

//     //     var result = await multiSig.addWallet(wallet2, {from: wallet0})
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)


//     //     var result = await multiSig.addWallet(wallet2, {from: wallet1})
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)

//     // })

//     // it("...have added First Wallet in a Single transaction.", async () => {
//     //     const multiSig = await MultiSigSimple.deployed()

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)

//     //     const wallet0 = accounts[0]
//     //     const wallet1 = accounts[1]

//     //     const message = "lololololol"
//     //     const directHash = web3.utils.sha3(message)
//     //     const prefixHex = web3.utils.utf8ToHex("\x19Ethereum Signed Message:\n32")
//     //     const ethMessage = prefixHex + directHash.slice(2)
//     //     const ethMessageHash = web3.utils.sha3(ethMessage)

//     //     const signature0 = await web3.eth.sign(directHash, wallet0)


//     //     var result = await multiSig.instaWalletAdd(wallet1, ethMessageHash, signature0)
//     //     console.log(result.receipt.gasUsed)


//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)

//     //     var result = await multiSig.instaWalletAdd(wallet1, ethMessageHash, signature0, {from: wallet1})
//     //     console.log(result.receipt.gasUsed)

//     //     var peerWallet0 = await multiSig.peerWallets(0)
//     //     console.log(peerWallet0)
//     //     var peerWallet1 = await multiSig.peerWallets(1)
//     //     console.log(peerWallet1)
//     //     var peerWallet2 = await multiSig.peerWallets(2)
//     //     console.log(peerWallet2)


//     // })

//     it("...have added First Wallet in a Single transaction.", async () => {
//         const multiSig = await MultiSigSimple.deployed()

//         const wallet0 = accounts[0]
//         const wallet1 = accounts[1]
//         const wallet2 = accounts[2]
//         const wallet3 = accounts[3]
//         const wallet4 = accounts[4]
//         const wallet5 = accounts[5]

//         const message = "lololololol"
//         const directHash = web3.utils.sha3(message)
//         const prefixHex = web3.utils.utf8ToHex("\x19Ethereum Signed Message:\n32")
//         // console.log("prefixHex: " + prefixHex)

//         const ethMessage = prefixHex + directHash.slice(2)
//         const ethMessageHash = web3.utils.sha3(ethMessage)

//         const signature0 = repairSignatureV(await web3.eth.sign(directHash, wallet0))
//         const signature1 = repairSignatureV(await web3.eth.sign(directHash, wallet1))
//         const signature2 = repairSignatureV(await web3.eth.sign(directHash, wallet2))

//         const recovered0 = await multiSig.recoverAddress(ethMessageHash, signature0)
//         const recovered1 = await multiSig.recoverAddress(ethMessageHash, signature1)
//         const recovered2 = await multiSig.recoverAddress(ethMessageHash, signature2)
//         console.log(recovered0)
//         console.log(recovered1)
//         console.log(recovered2)

//         const signatures01 = signature0 + signature1.slice(2)
//         const signatures012 = signature0 + signature1.slice(2) + signature2.slice(2)

//         var result = await multiSig.addRelevantWallet(wallet1, ethMessageHash, "0x00")
//         console.log(result.receipt.gasUsed)

//         var result = await multiSig.addRelevantWallet(wallet1, ethMessageHash, signature0, {from: wallet1})
//         console.log(result.receipt.gasUsed)

//         var result = await multiSig.addRelevantWallet(wallet2, ethMessageHash, signature0, {from: wallet1})
//         console.log(result.receipt.gasUsed)

//         var result = await multiSig.addRelevantWallet(wallet3, ethMessageHash, signatures01, {from: wallet2})
//         console.log(result.receipt.gasUsed)

//         var result = await multiSig.addRelevantWallet(wallet4, ethMessageHash, signatures012, {from: wallet3})
//         console.log(result.receipt.gasUsed)

//         var relevant = await multiSig.relevantWallets(wallet0)
//         console.log("wallet0 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet1)
//         console.log("wallet1 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet2)
//         console.log("wallet2 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet3)
//         console.log("wallet3 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet4)
//         console.log("wallet4 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet5)
//         console.log("wallet5 is relevant: " + relevant)
//     })

//     //#endregion

// })

// contract("MultiSigSingleTransaction", (accounts) => {

    //############################################################
    //#region ReadOnly Tests
    // it("...have added Wallets in a Single transaction.", async () => {
    //     const multiSig = await MultiSigSingleTransaction.deployed()

    //     const wallet0 = accounts[0]
    //     const wallet1 = accounts[1]
    //     const wallet2 = accounts[2]
    //     const wallet3 = accounts[3]
    //     const wallet4 = accounts[4]
    //     const wallet5 = accounts[5]

    //     var {vs, rs, ss} = getSignatureArrays("0x00")
    //     var result = await multiSig.addRelevantWallet(wallet1, vs, rs, ss)
    //     console.log(result.receipt.gasUsed)

    //     var message = await multiSig.getWalletActionMessage(wallet2, {from: wallet1})
    //     console.log(message)
    //     var signature0 = await getSignature(message, wallet0)
    //     console.log(signature0)

    //     var result = await multiSig.addRelevantWallet(wallet2, signature0, {from: wallet1})
    //     console.log(result.receipt.gasUsed)

    //     var message = await multiSig.getWalletActionMessage(wallet3, {from: wallet2})
    //     console.log(message)
    //     var signature0 = await getSignature(message, wallet0)
    //     console.log(signature0)
    //     var signature1 = await getSignature(message, wallet1)
    //     console.log(signature1)
    //     var signatures01 = signature0 + signature1.slice(2)

    //     var result = await multiSig.addRelevantWallet(wallet3, signatures01, {from: wallet2})
    //     console.log(result.receipt.gasUsed)

    //     var message = await multiSig.getWalletActionMessage(wallet4, {from: wallet3})
    //     console.log(message)
    //     var signature0 = await getSignature(message, wallet0)
    //     console.log(signature0)
    //     var signature1 = await getSignature(message, wallet1)
    //     console.log(signature1)
    //     var signature2 = await getSignature(message, wallet2)
    //     console.log(signature2)
    //     var signatures012 = signature0 + signature1.slice(2) + signature2.slice(2)

    //     var result = await multiSig.addRelevantWallet(wallet4, signatures012, {from: wallet3})
    //     console.log(result.receipt.gasUsed)

    //     var relevant = await multiSig.relevantWallets(wallet0)
    //     console.log("wallet0 is relevant: " + relevant)
    //     var relevant = await multiSig.relevantWallets(wallet1)
    //     console.log("wallet1 is relevant: " + relevant)
    //     var relevant = await multiSig.relevantWallets(wallet2)
    //     console.log("wallet2 is relevant: " + relevant)
    //     var relevant = await multiSig.relevantWallets(wallet3)
    //     console.log("wallet3 is relevant: " + relevant)
    //     var relevant = await multiSig.relevantWallets(wallet4)
    //     console.log("wallet4 is relevant: " + relevant)
    //     var relevant = await multiSig.relevantWallets(wallet5)
    //     console.log("wallet5 is relevant: " + relevant)
    // })

//     it("...have added Wallets in a Single transaction.", async () => {
//         const multiSig = await MultiSigSingleTransaction.deployed()

//         const wallet0 = accounts[0]
//         const wallet1 = accounts[1]
//         const wallet2 = accounts[2]
//         const wallet3 = accounts[3]
//         const wallet4 = accounts[4]
//         const wallet5 = accounts[5]

//         var {vs, rs, ss} = getSignatureArrays("0x00")
//         var result = await multiSig.addRelevantWallet(wallet1, vs, rs, ss)
//         console.log(result.receipt.gasUsed)

//         var message = await multiSig.getWalletActionMessage(wallet2, {from: wallet1})
//         console.log(message)
//         var signature0 = await getSignature(message, wallet0)
//         console.log(signature0)

//         var {vs, rs, ss} = getSignatureArrays(signature0)
//         var result = await multiSig.addRelevantWallet(wallet2, vs,rs, ss, {from: wallet1})
//         console.log(result.receipt.gasUsed)

//         var message = await multiSig.getWalletActionMessage(wallet3, {from: wallet2})
//         console.log(message)
//         var signature0 = await getSignature(message, wallet0)
//         console.log(signature0)
//         var signature1 = await getSignature(message, wallet1)
//         console.log(signature1)
//         var signatures01 = signature0 + signature1.slice(2)

//         var {vs, rs, ss} = getSignatureArrays(signatures01)
//         var result = await multiSig.addRelevantWallet(wallet3, vs, rs, ss, {from: wallet2})
//         console.log(result.receipt.gasUsed)

//         var message = await multiSig.getWalletActionMessage(wallet4, {from: wallet3})
//         console.log(message)
//         var signature0 = await getSignature(message, wallet0)
//         console.log(signature0)
//         var signature1 = await getSignature(message, wallet1)
//         console.log(signature1)
//         var signature2 = await getSignature(message, wallet2)
//         console.log(signature2)
//         var signatures012 = signature0 + signature1.slice(2) + signature2.slice(2)

//         var {vs, rs, ss} = getSignatureArrays(signatures012)
//         var result = await multiSig.addRelevantWallet(wallet4, vs, rs, ss, {from: wallet3})
//         console.log(result.receipt.gasUsed)

//         var relevant = await multiSig.relevantWallets(wallet0)
//         console.log("wallet0 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet1)
//         console.log("wallet1 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet2)
//         console.log("wallet2 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet3)
//         console.log("wallet3 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet4)
//         console.log("wallet4 is relevant: " + relevant)
//         var relevant = await multiSig.relevantWallets(wallet5)
//         console.log("wallet5 is relevant: " + relevant)
//     })
//     //#endregion

// })



// Available Accounts
// ==================
// (0) 0xe7182D7D3A313d666E3BA8EE29B5FA6193B0aF74 (100 ETH)
// (1) 0xd42EEbAB50f78F1b8Cbc5c2C1C60bD760bb1c021 (100 ETH)
// (2) 0xBD7A8198b1234e98cDCC2b1920Fc93A6F132CB98 (100 ETH)
// (3) 0xFA9cff570645B61A53648f23ADD76C9B51057A45 (100 ETH)
// (4) 0xC00878390fCf0aC5e069D4A4e95A3b90F072eF64 (100 ETH)
// (5) 0x40BA21Fb3accA3cB848C99052b77129cC106cE37 (100 ETH)
// (6) 0x9d953b3292C8CbD53291081465B8bEb5Dc7538Cb (100 ETH)
// (7) 0x1AD82d97e2e42fCfa4Ecf85F1c2C82A7EaFF08cE (100 ETH)
// (8) 0x2c06c9F7f267e04B953A5b6c73557f1E16c77DBB (100 ETH)
// (9) 0x7327b7A169817255Cd706b3462A3Cdc00CB04c57 (100 ETH)

// Private Keys
// ==================
// (0) 0x60f962da3cdfb2cf428b66ea600752c9bbba09469dce296d3a08c30ac6e601bc
// (1) 0x4f606394867e830146b5c8a1b7c919b3254066086c3a650b5a804f3679ffc250
// (2) 0x41972b816d99fc9648530d5f4d38379810c13cf0a7f6913a107c7c472677253c
// (3) 0x49a30b9c53d7a439d9cb2c5fac315a32b14d9e1e1038111014d5e1c7928493de
// (4) 0xd4e68117806b10fdf5ac64cd395d6ae27796242d46ddb9eaa6765d56096b7e5e
// (5) 0x35ca525f596ebabce64b0e2442827cc757dd6afd744ea7033f5ef17086813ca7
// (6) 0x73ecd736b163fe296119e2da58b2441e1bd1aaabccaa62b58eec4cbd0368ba80
// (7) 0x58d204ffa7d6063a7788c39baf09407b1b09d7291e9638ca65bda5490c19bf8a
// (8) 0x8b36c78ddb4eb82bd71c78e885bac89aca9b42204708602dac46a305a0332f37
// (9) 0x1890f7e10382269cd8b4b07fcf07ebe075b5e7681c8ccf3cbc08482aad178f8c

// HD Wallet
// ==================
// Mnemonic:      wish genuine garbage cheese inquiry sort foot gorilla garden call visual army
// Base HD Path:  m/44'/60'/0'/0/{account_index}

// Available Accounts
// ==================
// (0) 0xe4C95FEed13cdd5C97f70D405CE989213a538B7D (100 ETH)
// (1) 0xD3DdbC6a43EEcEfa59D115C056d9f89D58ffe5F6 (100 ETH)
// (2) 0x24a6281b5C52dc8432BBc54E52f6c1cE46411FC3 (100 ETH)
// (3) 0x679fDd7371F931e58F57099fd9F4939fdC65B799 (100 ETH)
// (4) 0x7F045f671f41832DE37f3F7D128F7Af7520d19a0 (100 ETH)
// (5) 0x5c0C205b7Cf90F5f46b0A694ed873E4F10af9DC1 (100 ETH)
// (6) 0x0C0aa91d8A9FFf9e6c57c1b74A79b1594646A166 (100 ETH)
// (7) 0x27671Ea969dAe036B08d4d9ed1B4aAEC9c3549D8 (100 ETH)
// (8) 0xC1bEB6f348fb22c37daa29190DA99e34aaa6ea6d (100 ETH)
// (9) 0x591570E4943c1f5C4F9EBEDb09cAC2ab5EB2D591 (100 ETH)

// Private Keys
// ==================
// (0) 0x231408814f5a1242bd3d5b7b5bf2f931ab03e19b3d2b17bcd7d3ddd51cb344ac
// (1) 0x1894d7d265ffa6a1c4d65d616d758291adab1d5c5d5071e57b64e68524209841
// (2) 0x678439de36836e5d563755244d542b912fff1e04159d511057cb8623ed183943
// (3) 0x00cf668be8bb8ba400ab9fbc90e58f0dd1e0170e7dd363b8412fb58f8da98610
// (4) 0x652e67a742b1812e290a57fcfa8ef2a80dc09ed5bb314be9c68c769a5b27193a
// (5) 0x77a0c25d8e4e974ff62fa1b4563f6351494e692822057fb262f6269d85827c3f
// (6) 0x3613d5ec8085f8ed21aa332f005ce6ec66f751ad87c3b75662ad56207cebc190
// (7) 0xe02e5c640a7da6ca4665d042868410befdbd388c47a377aaf34c6d2d458bf1b9
// (8) 0x28d7bac70b8d413dd023e7750b33dd001b6db6cf29fd1e504c4e8d576d04ab3d
// (9) 0x760de399e53c73343067f3fd43f069d3993ff80c0a4d684193f6b6f21e8b1075

// HD Wallet
// ==================
// Mnemonic:      type curtain fashion good marriage leopard embody fee proof good surprise effort
// Base HD Path:  m/44'/60'/0'/0/{account_index}

// Available Accounts
// ==================
// (0) 0x74159A2455d92371f2c38fb48cb9d27486397355 (100 ETH)
// (1) 0x32B9fC4e668E75bC638471E0306B45141CeD36e3 (100 ETH)
// (2) 0xEdC64d0B55828a5DF1ffcd2bB5E6dD284bb09e42 (100 ETH)
// (3) 0x7A3b0C5AdA2E8B750A4CE74D6b1d09F3422C107A (100 ETH)
// (4) 0x87572E338Be09202a8d686D217AC0da5886227e0 (100 ETH)
// (5) 0x99146A31A5f237ED7318eeDfB851485d90ad2432 (100 ETH)
// (6) 0x4ff72DC370c24E6cd38008E57E731Af60FdD4595 (100 ETH)
// (7) 0x2E78be1FD5D94DF44FF33EFF503d07CdeaF65aE8 (100 ETH)
// (8) 0x9Cd79Ba2cc6fDA1D81f0A541ECFFEA43bAE70788 (100 ETH)
// (9) 0xbA104d68caDf48e8a5f94a2212957C7592826b89 (100 ETH)

// Private Keys
// ==================
// (0) 0x94f3c93e0b156726c13abf5d0dd64e0d10aba4e87879e076b09d8cc349141675
// (1) 0xd7586deb5dc661a144fb653660ab90ffaa64d29774fb45db91bac3f770f30ef7
// (2) 0x4ab6453745c94c12775faeb48c6e923c2512e37900f5b337762dcbef71995e89
// (3) 0x6c6b656c990b7ba9a28329bc1633cd30ad6a2b46e2ccd6673045ff8c4dfbf749
// (4) 0x73b3683f0a9698ca464071b968d8b05bac47e9ad4b6889bb9c2f25ee9d64efd9
// (5) 0x253f536228711282075618c66baa98813c68b11753b2c20cd843d1c4705bddf8
// (6) 0xdc18389b94238598ae989f7e25b8c45f5cb7659d0e26e6d3e9acf4c50bf1db91
// (7) 0xb1c60500245b246b13bd30d9b9e985ca9b51d7829ad76dd75ffbe86e38360d3c
// (8) 0x60e69b41475a7d849c3ecbc4ea2fe2748158c60be3ae96786c67da6763454076
// (9) 0xca0634908fe845dfbddcde0109bd30bed3ba6c8ee4540ef7fa863ab1b491f5c9

// HD Wallet
// ==================
// Mnemonic:      army upper night neglect insect blouse base pistol vote enjoy immune ostrich
// Base HD Path:  m/44'/60'/0'/0/{account_index}
