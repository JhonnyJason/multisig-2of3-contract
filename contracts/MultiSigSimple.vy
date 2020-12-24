# @version ^0.2.8

############################################################
CLEAN_STATE: constant(Bytes[1]) = 0x00
ADD_WALLET_STATE: constant(Bytes[1]) = 0x01
REMOVE_WALLET_STATE: constant(Bytes[1]) = 0x02
SEND_ETHER_STATE: constant(Bytes[1]) = 0x03
EXECUTE_TRANSACTION_STATE: constant(Bytes[1]) = 0x04

MAX_WALLETS: constant(uint256) = 5
V_MASK: constant(uint256) = 255
MESSAGE_PREFIX: constant(Bytes[28]) = 0x19457468657265756d205369676e6564204d6573736167653a0a3332
INITIAL_PONCE: constant(bytes32) = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef

############################################################
struct Meta:
    state: Bytes[1]
    approvals: Bytes[1]


############################################################
#region internalProperties

############################################################
relevantWallets: public(HashMap[address, bool])
relevantVotes: public(uint256)
ponce: public(bytes32) # pattern used once

peerWallets: public(address[8])
walletApprovals: public(HashMap[address, bool])
meta: Meta

############################################################
suggestedTransaction: Bytes[1024]
etherAmount: uint256
wallet: address

#endregion

############################################################
@external
# def __init__(_relevantWallets: address[4]):
def __init__():
    self.peerWallets[0] = msg.sender

    self.relevantVotes = 1
    self.relevantWallets[msg.sender] = True
    self.ponce = INITIAL_PONCE

############################################################
#region exposedFunctions

############################################################
#region readOnlyFunctions
@external
@view
def recoverAddress(_hash:bytes32, _signature:Bytes[65]) -> address:
    _v: uint256 = 0
    _r: uint256 = 0
    _s: uint256 = 0
    
    ########################################################
    _r = extract32(_signature, 0, output_type=uint256)
    _s = extract32(_signature, 32, output_type=uint256)
    _v = extract32(_signature, 33, output_type=uint256)
    _v = bitwise_and(_v, V_MASK)
    return ecrecover(_hash, _v, _r, _s)


@external
@view
def numberOfWallets() -> uint256:
    _number: uint256 = 0
    for _addr in self.peerWallets:
        if _addr != ZERO_ADDRESS:
            _number += 1
    return _number

@external
@view
def getSuggestedTransaction() -> Bytes[1024]:
    return self.suggestedTransaction

#endregion

############################################################
#region writeFunctions

############################################################
#region add/remove wallets
@external
def suggestWalletAdd(_wallet: address) -> bool:
    assert _wallet != ZERO_ADDRESS

    ########################################################
    if self.meta.state == CLEAN_STATE:
        self.meta.state = ADD_WALLET_STATE
        self.wallet = _wallet
        return True

    return False

############################################################
@external
def approveWalletAdd(_wallet: address) -> bool:
    assert self.meta.state == ADD_WALLET_STATE

    ########################################################
    if self.wallet != _wallet:
        raise "Incorrect wallet!"

    ########################################################
    for _addr in self.peerWallets:
        if _addr == ZERO_ADDRESS:
            break
        if _addr == msg.sender:
            self.walletApprovals[msg.sender] = True
            return True

    return False

############################################################
@external
def declineWalletAdd(_wallet: address) -> bool:
    assert self.meta.state == ADD_WALLET_STATE

    ########################################################
    if self.wallet != _wallet:
        raise "Incorrect wallet!"

    ########################################################
    _valid: bool = False
    ########################################################
    for _addr in self.peerWallets:
        if _addr == ZERO_ADDRESS:
            break
        if _addr == msg.sender:
            _valid = True
            break
    
    ########################################################
    if _valid:
        self.meta.state = CLEAN_STATE
        self.wallet = ZERO_ADDRESS

        for _addr in self.peerWallets:
            if _addr == ZERO_ADDRESS:
                break
            self.walletApprovals[_addr] = False

        return True

    return False

############################################################
@external
def executeWalletAdd(_wallet: address) -> bool:
    assert self.meta.state == ADD_WALLET_STATE

    ########################################################
    if self.wallet != _wallet:
        raise "Incorrect wallet!"

    _new_index: uint256 = 0
    ########################################################
    for _addr in self.peerWallets:
        if _addr == ZERO_ADDRESS:
            break
        if not self.walletApprovals[_addr]:
            return False
        _new_index += 1

    ########################################################
    self.peerWallets[_new_index] = _wallet
    self.meta.state = CLEAN_STATE
    self.wallet = ZERO_ADDRESS

    for _addr in self.peerWallets:
        if _addr == ZERO_ADDRESS:
            break
        self.walletApprovals[_addr] = False

    return True

############################################################
@external
def addWallet(_wallet: address) -> bool:
    assert _wallet != ZERO_ADDRESS

    ########################################################
    # all wallets need to approve
    _new_index: uint256 = 0
    _valid: bool = False
    
    ########################################################
    for _addr in self.peerWallets:
        if _addr == ZERO_ADDRESS:
            break
        if _addr == _wallet:
            return True
        if _addr == msg.sender:
            _valid = True
        _new_index += 1
    
    ########################################################
    assert _valid

    ########################################################
    #region assert correct state
    if self.meta.state == CLEAN_STATE:
        self.meta.state = ADD_WALLET_STATE
        self.wallet = _wallet
    elif self.meta.state == ADD_WALLET_STATE:
        assert self.wallet == _wallet, "Incorrect wallet!"
    else:
        raise "Incorrect state!"
    
    #endregion
    
    ########################################################
    self.walletApprovals[msg.sender] = True

    ########################################################
    for _addr in self.peerWallets:
        if _addr == ZERO_ADDRESS:
            break
        if not self.walletApprovals[_addr]:
            return True

    ########################################################
    # all wallets have approved
    self.peerWallets[_new_index] = _wallet

    ########################################################
    #region resetState
    for _addr in self.peerWallets:
        self.walletApprovals[_addr] = False
        if _addr == ZERO_ADDRESS:
            break

    self.meta.state = CLEAN_STATE
    self.wallet = ZERO_ADDRESS
    #endregion
    return False

############################################################
@external
def instaWalletAdd(_wallet: address, _hash: bytes32, _signatures: Bytes[455]) -> bool:
    _approvedAddresses: address[8] = [ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS]
    
    _v: uint256 = 0
    _r: uint256 = 0
    _s: uint256 = 0

    _addr: address = ZERO_ADDRESS
    _valid: bool = False

    self.walletApprovals[msg.sender] = True
    _approvedAddresses[7] = msg.sender
    
    ########################################################
    for i in range(7):
        if i*65 >= len(_signatures):
            break
        _r = convert(slice(_signatures, i*65, 32), uint256)
        _s = convert(slice(_signatures, i*65+32, 32), uint256)
        _v = convert(slice(_signatures, i*65+64, 1), uint256)
        if _v < 27:
            _v += 27    
        _addr = ecrecover(_hash, _v, _r, _s)
        self.walletApprovals[_addr] = True
        _approvedAddresses[i] = _addr

    ########################################################
    for _w in self.peerWallets:
        if _w != ZERO_ADDRESS:
            assert self.walletApprovals[_w]
    
    ########################################################
    #Hurray! Everybody approved!
    for i in range(8):
        if self.peerWallets[i] == ZERO_ADDRESS:
            self.peerWallets[i] = _wallet
            break
        elif self.peerWallets[i] == _wallet:
            break

    ########################################################
    for _a in _approvedAddresses:
        self.walletApprovals[_a] = False
    return True


@external
def addRelevantWallet(_wallet: address, _hash: bytes32, _signatures: Bytes[260]) -> bool:
    if self.relevantWallets[_wallet]:
        return True
    assert _wallet != ZERO_ADDRESS
    assert self.relevantVotes < MAX_WALLETS 

    _approvers: address[5] = [ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS]
    _approvals: uint256 = 0
    
    _v: uint256 = 0
    _r: uint256 = 0
    _s: uint256 = 0

    _addr: address = ZERO_ADDRESS
    _len: int128 = convert(len(_signatures), int128)

    if self.relevantWallets[msg.sender]:
        self.relevantWallets[msg.sender] = False # no double vote!
        _approvers[_approvals] = msg.sender
        _approvals += 1
    
    ########################################################
    for i in [0,65,130,195]:
        if _len < i+65:
            break
        _r = extract32(_signatures, i, output_type=uint256)
        _s = extract32(_signatures, i+32, output_type=uint256)
        _v = extract32(_signatures, i+33, output_type=uint256)
        _v = bitwise_and(_v, V_MASK)
        _addr = ecrecover(_hash, _v, _r, _s)
        if self.relevantWallets[_addr]: # on ZERO_ADDRESS this will never be True
            self.relevantWallets[_addr] = False # no double vote!
            _approvers[_approvals] = _addr
            _approvals += 1

    ########################################################
    assert _approvals == self.relevantVotes
    #  Hurray! Everybody approved!    
    
    ########################################################
    # give back vote privilege to relevant Voters
    for _approver in _approvers:
        if _approver == ZERO_ADDRESS:
            break
        else:
            self.relevantWallets[_approver] = True
    
    ########################################################
    if not self.relevantWallets[_wallet]:
        self.relevantWallets[_wallet] = True
        self.relevantVotes += 1
    return True

#endregion




@external
def suggestTransaction(_transaction: Bytes[1024]) -> bool:
    self.suggestedTransaction = _transaction
    return True

@external
def approveTransaction(_transaction: Bytes[1024]) -> bool:
    self.suggestedTransaction = _transaction
    return True

#endregion

event TransactionExecuted:
    _nonce: indexed(bytes32)
