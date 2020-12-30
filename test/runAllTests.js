const fs = require("fs")

const MultiSig2of3 = artifacts.require("MultiSig2of3")
const PrivateCounter = artifacts.require("PrivateCounter")


const walletMissingMessage = "Wallet Missing"
const invalidSenderMessage = "Invalid Sender"
const invalidSignatureMessage = "Invalid Signature"
const signerIsSenderMessage = "Sender is Signer"


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

function numberToPaddedBytes32(number) {
    var bytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000"
    var hex = web3.utils.numberToHex(number.toString())
    var l = hex.length - 2
    var fl = bytes32.length
    return bytes32.slice(0, fl - l) + hex.slice(2)
}
function addressToPaddedBytes32(address) {
    var padding = "0x000000000000000000000000"
    return padding + address.slice(2) 
}

function getWalletActionMessage(wallet, ponce, sender) {
    wallet = addressToPaddedBytes32(wallet)
    sender = addressToPaddedBytes32(sender)
    return wallet + ponce.slice(2) + sender.slice(2)
}
function getSendEtherMessage(amount, ponce, sender) {
    amount = numberToPaddedBytes32(amount)
    sender = addressToPaddedBytes32(sender)
    return amount + ponce.slice(2) + sender.slice(2)
}
function getTransactionMessage(target, sentValue, data, ponce, sender) {
    target = addressToPaddedBytes32(target)
    sentValue = numberToPaddedBytes32(sentValue)
    var message = target + sentValue.slice(2) + data.slice(2)
    var hash = web3.utils.keccak256(message)
    sender = addressToPaddedBytes32(sender)
    return hash + ponce.slice(2) + sender.slice(2)

}


contract("MultiSig2of3", (accounts) => {

    //############################################################
    it("...have all initial wallets.", async () => {
        const c = await MultiSig2of3.deployed()
        
        const isComplete = await c.isComplete()        
        assert.equal(isComplete, true, "Did not have isComplete being true!")

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        const hasWallet0 = await c.isAuthorized(w0)
        const hasWallet1 = await c.isAuthorized(w1)
        const hasWallet2 = await c.isAuthorized(w2)
        const hasWallet3 = await c.isAuthorized(w3)

        assert.equal(hasWallet0, true, "Wallet 0 was not relevant!")
        assert.equal(hasWallet1, true, "Wallet 1 was not relevant!")
        assert.equal(hasWallet2, true, "Wallet 2 was not relevant!")

        assert.equal(hasWallet3, false, "Wallet 3 was relevant!")
    })

    //############################################################
    it("...not be able to do invalid requests.", async () => {
        const c = await MultiSig2of3.deployed()
        
        const cc = await PrivateCounter.deployed()
        const ccAddress = cc.address
        const ccJSON = JSON.parse(fs.readFileSync("./build/contracts/PrivateCounter.json", "utf-8"))
        const web3CC = new web3.eth.Contract(ccJSON.abi, ccAddress)
        const transactionData = web3CC.methods.addFourNumbers(1,1,1,2).encodeABI()
        
        var hasFailed = true

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        //sent by invalid w3 signed by valid w0 - remove wallet
        // var message = await c.getWalletActionMessage(w2, {from:w3})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2,ponce, w3)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.removeAuthorizedWallet(w2, v, r, s,{from:w3})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Removing Wallet from w3 did not fail!")

        //sent by invalid w3 signed by valid w0 - send ether
        // var message = await c.getSendEtherMessage(0, {from:w3})
        var ponce = await c.ponce()
        var message = getSendEtherMessage(0, ponce, w3)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.sendEther(w2, 0, v, r, s,{from:w3})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Sending Ether from w3 did not fail!")

        //sent by invalid w3 signed by valid w0 - arbitrary transaction
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w3})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0, transactionData, ponce, w3)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w3})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Arbitrary Transaction from w3 did not fail!")

        //sent by valid w1 signed by invalid w3 - remove wallet
        // var message = await c.getWalletActionMessage(w2, {from:w1})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2, ponce, w1)
        var signature = await getSignature(message, w3)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.removeAuthorizedWallet(w2, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Removing Wallet with invalid signer did not fail!")

        //sent by valid w1 signed by invalid w3 - send ether
        // var message = await c.getSendEtherMessage(0, {from:w1})
        var ponce = await c.ponce()
        var message = getSendEtherMessage(0, ponce, w1)
        var signature = await getSignature(message, w3)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.sendEther(w2, 0, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Sending Ether with invalid signer did not fail!")

        //sent by valid w1 signed by invalid w3 - arbitrary transaction
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w1})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0, transactionData, ponce, w1)
        var signature = await getSignature(message, w3)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Arbitrary Transaction from w3 did not fail!")


        //sent by valid w1 signed by valid w1 - remove wallet
        // var message = await c.getWalletActionMessage(w2, {from:w1})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2, ponce, w1)
        var signature = await getSignature(message, w1)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.removeAuthorizedWallet(w2, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, signerIsSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Removing Wallet with invalid signer did not fail!")

        //sent by valid w1 signed by valid w1 - send ether
        // var message = await c.getSendEtherMessage(0, {from:w1})
        var ponce = await c.ponce()
        var message = getSendEtherMessage(0, ponce, w1)
        var signature = await getSignature(message, w1)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.sendEther(w2, 0, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, signerIsSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Sending Ether with invalid signer did not fail!")

        //sent by valid w1 signed by valid w1 - arbitrary transaction
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w1})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0, transactionData, ponce, w1)
        var signature = await getSignature(message, w1)
        var {v, r, s} = getSignatureParams(signature)
        
        try {
            var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            // console.log(error.reason)
            assert.equal(error.reason, signerIsSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Arbitrary Transaction from w3 did not fail!")


        //sent by wrong sender - remove wallet
        // var message = await c.getWalletActionMessage(w2, {from:w0})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2, ponce, w0)
        var signature = await getSignature(message, w2)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.removeAuthorizedWallet(w2, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Removing Wallet with invalid signer did not fail!")

        //sent by wrong sender - send ether
        // var message = await c.getSendEtherMessage(0, {from:w0})
        var ponce = await c.ponce()
        var message = getSendEtherMessage(0, ponce, w0)
        var signature = await getSignature(message, w2)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.sendEther(w2, 0, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Sending Ether with invalid signer did not fail!")

        //sent wrong sender - arbitrary transaction
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w0})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0, transactionData, ponce, w0)
        var signature = await getSignature(message, w2)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            // console.log(error.reason)
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Arbitrary Transaction where sender is signer did not fail!")


    })
    //############################################################
    it("...be able to remove a wallet.", async () => {
        const c = await MultiSig2of3.deployed()
        
        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        // remove w2 sent by w1 signed by w0
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        var result = await c.removeAuthorizedWallet(w2, v, r, s,{from:w1})
        console.log(result.receipt.gasUsed)

        const isComplete = await c.isComplete()        
        assert.equal(isComplete, false, "We still have all wallets after removing!")

        const hasWallet0 = await c.isAuthorized(w0)
        const hasWallet1 = await c.isAuthorized(w1)
        const hasWallet2 = await c.isAuthorized(w2)
        const hasWallet3 = await c.isAuthorized(w3)

        assert.equal(hasWallet0, true, "Wallet 0 was not relevant!")
        assert.equal(hasWallet1, true, "Wallet 1 was not relevant!")
        assert.equal(hasWallet2, false, "Wallet 2 was still relevant!")
        assert.equal(hasWallet3, false, "Wallet 3 was relevant!")

    })
    //############################################################
    it("...not be able to do anything without having all wallets.", async () => {
        const c = await MultiSig2of3.deployed()
        
        const cc = await PrivateCounter.deployed()
        const ccAddress = cc.address
        const ccJSON = JSON.parse(fs.readFileSync("./build/contracts/PrivateCounter.json", "utf-8"))
        const web3CC = new web3.eth.Contract(ccJSON.abi, ccAddress)
        const transactionData = web3CC.methods.addFourNumbers(1,1,1,2).encodeABI()
        
        var hasFailed = true

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        //sent by w1 - signed by w0 - remove wallet
        // var message = await c.getWalletActionMessage(w2, {from:w1})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.removeAuthorizedWallet(w2, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            assert.equal(error.reason, walletMissingMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Removing Wallet from did not fail sespite missing wallet!")

        //sent by w1 - signed by w0 - send ether
        // var message = await c.getSendEtherMessage(0, {from:w1})
        var ponce = await c.ponce()
        var message = getSendEtherMessage(0, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.sendEther(w2, 0, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            assert.equal(error.reason, walletMissingMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Sending Ether did not fail - despite missing wallet!")

        //sent by w1 - signed by w0 - arbitrary transaction
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w1})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0, transactionData, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            assert.equal(error.reason, walletMissingMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Arbitrary Transaction did not fail- despite missing wallet!")

        // add w3 sent by w1 signed by w0
        var zeroAddress = "0x0000000000000000000000000000000000000000"
        // var message = await c.getWalletActionMessage(zeroAddress, {from:w1})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(zeroAddress, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)
        
        try{
            var result = await c.addAuthorizedWallet(zeroAddress, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            assert.equal(error.reason, "Cannot add ZERO_ADDRESS!", "Wrong reason!")   
        }
        assert.equal(hasFailed, true, "Adding ZeroAddress did not fail!")

    })
    //############################################################
    it("...be able to do add a new wallet.", async () => {
        const c = await MultiSig2of3.deployed()

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        // add w3 sent by w1 signed by w0
        // var message = await c.getWalletActionMessage(w3, {from:w1})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w3, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)
        
        var result = await c.addAuthorizedWallet(w3, v, r, s,{from:w1})
        console.log(result.receipt.gasUsed)

        const isComplete = await c.isComplete()        
        assert.equal(isComplete, true, "We still did not have all Wallets!")

        const hasWallet0 = await c.isAuthorized(w0)
        const hasWallet1 = await c.isAuthorized(w1)
        const hasWallet2 = await c.isAuthorized(w2)
        const hasWallet3 = await c.isAuthorized(w3)

        assert.equal(hasWallet0, true, "Wallet 0 was not relevant!")
        assert.equal(hasWallet1, true, "Wallet 1 was not relevant!")
        assert.equal(hasWallet2, false, "Wallet 2 was relevant!")
        assert.equal(hasWallet3, true, "Wallet 3 was still not relevant!")

    })
    //############################################################
    it("...not be able to do invalid requests.", async () => {
        const c = await MultiSig2of3.deployed()
        
        const cc = await PrivateCounter.deployed()
        const ccAddress = cc.address
        const ccJSON = JSON.parse(fs.readFileSync("./build/contracts/PrivateCounter.json", "utf-8"))
        const web3CC = new web3.eth.Contract(ccJSON.abi, ccAddress)
        const transactionData = web3CC.methods.addFourNumbers(1,1,1,2).encodeABI()
        
        var hasFailed = true

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]

        //sent by invalid w2 signed by valid w0 - remove wallet
        // var message = await c.getWalletActionMessage(w2, {from:w2})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2, ponce, w2)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.removeAuthorizedWallet(w0, v, r, s,{from:w2})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            assert.equal(error.reason, invalidSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Removing Wallet from w3 did not fail!")

        //sent by invalid w2 signed by valid w0 - send ether
        // var message = await c.getSendEtherMessage(0, {from:w2})
        var ponce = await c.ponce()
        var message = getSendEtherMessage(0, ponce, w2)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.sendEther(w2, 0, v, r, s,{from:w2})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            assert.equal(error.reason, invalidSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Sending Ether from w3 did not fail!")

        //sent by invalid w2 signed by valid w0 - arbitrary transaction
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w2})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0, transactionData, ponce, w2)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)
        try {
            var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w2})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            assert.equal(error.reason, invalidSenderMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Arbitrary Transaction from w3 did not fail!")

        //sent by valid w1 signed by invalid w2 - remove wallet
        // var message = await c.getWalletActionMessage(w2, {from:w1})
        var ponce = await c.ponce()
        var message = getWalletActionMessage(w2, ponce, w1)
        var signature = await getSignature(message, w2)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.removeAuthorizedWallet(w0, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Removing Wallet with invalid signer did not fail!")

        //sent by valid w1 signed by invalid w2 - send ether
        // var message = await c.getSendEtherMessage(0, {from:w1})
        var ponce = await c.ponce()
        var message = getSendEtherMessage(0, ponce, w1)
        var signature = await getSignature(message, w2)
        var {v, r, s} = getSignatureParams(signature)

        try {
            var result = await c.sendEther(w2, 0, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false
        } catch (error) {
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Sending Ether with invalid signer did not fail!")

        //sent by valid w1 signed by invalid w2 - arbitrary transaction
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w1})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0,transactionData, ponce, w1)
        var signature = await getSignature(message, w2)
        var {v, r, s} = getSignatureParams(signature)
        try {
            var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w1})
            console.log(result.receipt.gasUsed)
            hasFailed = false    
        } catch(error) {
            assert.equal(error.reason, invalidSignatureMessage, "Wrong reason!")
        }
        assert.equal(hasFailed, true, "Arbitrary Transaction from w3 did not fail!")

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
        var ponce = await c.ponce()
        var message = getSendEtherMessage(amount, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)
        
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
        const ccAddress = cc.address
        const ccJSON = JSON.parse(fs.readFileSync("./build/contracts/PrivateCounter.json", "utf-8"))
        const web3CC = new web3.eth.Contract(ccJSON.abi, ccAddress)
        const transactionData = web3CC.methods.addFourNumbers(1,1,1,2).encodeABI()

        const w0 = accounts[0]
        const w1 = accounts[1]
        const w2 = accounts[2]
        const w3 = accounts[3]
        
        const ccContractBefore = BigInt(await cc.privateCounts(c.address))
        const ccSenderBefore = BigInt(await cc.privateCounts(w1))
        const desiredCCSenderAfter = ccSenderBefore
        const desiredCCContractAfter = ccContractBefore + 5n


        // sent by w1 signed by w0
        // var message = await c.getTransactionMessage(cc.address, 0, transactionData, {from:w1})
        var ponce = await c.ponce()
        var message = getTransactionMessage(cc.address, 0, transactionData, ponce, w1)
        var signature = await getSignature(message, w0)
        var {v, r, s} = getSignatureParams(signature)
        
        var result = await c.doTransaction(cc.address, 0, transactionData, v, r, s,{from:w1})
        console.log(result.receipt.gasUsed)

        const ccContractAfter = BigInt(await cc.getPrivateCounts(c.address))
        const ccSenderAfter = BigInt(await cc.getPrivateCounts(w1))
        assert.equal(ccContractAfter,desiredCCContractAfter, "The count of the contract did not increase!")
        assert.equal(ccSenderAfter, desiredCCSenderAfter, "The senders count did not stay the same!")
    })

})