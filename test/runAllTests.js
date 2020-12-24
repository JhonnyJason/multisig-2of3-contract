const MultiSigSimple = artifacts.require("MultiSigSimple")
const MultiSigSingleTransaction = artifacts.require("MultiSigSingleTransaction")

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
function getSignatureArrays(signatures) {
    var pureSignatures = signatures.slice(2)
    var pureLength = pureSignatures.length

    var vs = ["0x00","0x00","0x00","0x00","0x00"]
    var rs = ["0x00","0x00","0x00","0x00","0x00"]
    var ss = ["0x00","0x00","0x00","0x00","0x00"]

    var base = 0
    var index = 0
    if( pureLength >= 130) {
        rs[index] = "0x"+pureSignatures.slice(0,64)
        ss[index] = "0x"+pureSignatures.slice(64,128)
        vs[index] = "0x"+pureSignatures.slice(128,130)
    }

    base += 130
    index++
    if( pureLength >= base+130) {
        rs[index] = "0x"+pureSignatures.slice(base,base+64)
        ss[index] = "0x"+pureSignatures.slice(base+64,base+128)
        vs[index] = "0x"+pureSignatures.slice(base+128,base+130)
    }

    base += 130
    index++
    if( pureLength >= base+130) {
        rs[index] = "0x"+pureSignatures.slice(base,base+64)
        ss[index] = "0x"+pureSignatures.slice(base+64,base+128)
        vs[index] = "0x"+pureSignatures.slice(base+128,base+130)
    }

    base += 130
    index++
    if( pureLength >= base+130) {
        rs[index] = "0x"+pureSignatures.slice(base,base+64)
        ss[index] = "0x"+pureSignatures.slice(base+64,base+128)
        vs[index] = "0x"+pureSignatures.slice(base+128,base+130)
    }

    base += 130
    index++
    if( pureLength >= base+130) {
        rs[index] = "0x"+pureSignatures.slice(base,base+64)
        ss[index] = "0x"+pureSignatures.slice(base+64,base+128)
        vs[index] = "0x"+pureSignatures.slice(base+128,base+130)
    }

    base += 130
    index++
    if( pureLength >= base+130) {
        rs[index] = "0x"+pureSignatures.slice(base,base+64)
        ss[index] = "0x"+pureSignatures.slice(base+64,base+128)
        vs[index] = "0x"+pureSignatures.slice(base+128,base+130)
    }

    return {vs, rs, ss}
}

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

contract("MultiSigSingleTransaction", (accounts) => {

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

    it("...have added Wallets in a Single transaction.", async () => {
        const multiSig = await MultiSigSingleTransaction.deployed()

        const wallet0 = accounts[0]
        const wallet1 = accounts[1]
        const wallet2 = accounts[2]
        const wallet3 = accounts[3]
        const wallet4 = accounts[4]
        const wallet5 = accounts[5]

        var {vs, rs, ss} = getSignatureArrays("0x00")
        var result = await multiSig.addRelevantWallet(wallet1, vs, rs, ss)
        console.log(result.receipt.gasUsed)

        var message = await multiSig.getWalletActionMessage(wallet2, {from: wallet1})
        console.log(message)
        var signature0 = await getSignature(message, wallet0)
        console.log(signature0)

        var {vs, rs, ss} = getSignatureArrays(signature0)
        var result = await multiSig.addRelevantWallet(wallet2, vs,rs, ss, {from: wallet1})
        console.log(result.receipt.gasUsed)

        var message = await multiSig.getWalletActionMessage(wallet3, {from: wallet2})
        console.log(message)
        var signature0 = await getSignature(message, wallet0)
        console.log(signature0)
        var signature1 = await getSignature(message, wallet1)
        console.log(signature1)
        var signatures01 = signature0 + signature1.slice(2)

        var {vs, rs, ss} = getSignatureArrays(signatures01)
        var result = await multiSig.addRelevantWallet(wallet3, vs, rs, ss, {from: wallet2})
        console.log(result.receipt.gasUsed)

        var message = await multiSig.getWalletActionMessage(wallet4, {from: wallet3})
        console.log(message)
        var signature0 = await getSignature(message, wallet0)
        console.log(signature0)
        var signature1 = await getSignature(message, wallet1)
        console.log(signature1)
        var signature2 = await getSignature(message, wallet2)
        console.log(signature2)
        var signatures012 = signature0 + signature1.slice(2) + signature2.slice(2)

        var {vs, rs, ss} = getSignatureArrays(signatures012)
        var result = await multiSig.addRelevantWallet(wallet4, vs, rs, ss, {from: wallet3})
        console.log(result.receipt.gasUsed)

        var relevant = await multiSig.relevantWallets(wallet0)
        console.log("wallet0 is relevant: " + relevant)
        var relevant = await multiSig.relevantWallets(wallet1)
        console.log("wallet1 is relevant: " + relevant)
        var relevant = await multiSig.relevantWallets(wallet2)
        console.log("wallet2 is relevant: " + relevant)
        var relevant = await multiSig.relevantWallets(wallet3)
        console.log("wallet3 is relevant: " + relevant)
        var relevant = await multiSig.relevantWallets(wallet4)
        console.log("wallet4 is relevant: " + relevant)
        var relevant = await multiSig.relevantWallets(wallet5)
        console.log("wallet5 is relevant: " + relevant)
    })
    //#endregion

})
