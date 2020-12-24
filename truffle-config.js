/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura API
 * keys are available for free at: infura.io/register
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const HDWallet = require('truffle-hdwallet-provider');
require('dotenv').config()
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();


console.log(process.env.MNEMONIC)
console.log(process.env.INFURA_PROJECT_ID)

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        },
        ropsten: {
            provider: () => new HDWallet(process.env.MNEMONIC, "https://ropsten.infura.io/v3/"+process.env.INFURA_PROJECT_ID),
            network_id: 3,
            gas: 8000000,
            gasPrice: 10000000000
        }
    }
    // ,
    // compilers: {
    //     solc: {
    //       version: "^0.6.0"
    //     }
    // }
}
