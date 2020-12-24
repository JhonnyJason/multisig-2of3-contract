# @version ^0.2.8

############################################################
MAX_WALLETS: constant(uint256) = 5

V_MASK: constant(uint256) = 255

PREFIX: constant(Bytes[28]) = 0x19457468657265756d205369676e6564204d6573736167653a0a3936

INITIAL_PONCE: constant(bytes32) = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef

############################################################
#region internalProperties

############################################################
relevantWallets: public(HashMap[address, bool])
relevantVotes: public(uint256)
ponce: public(bytes32) # pattern used once

#endregion

############################################################
@external
# def __init__(_relevantWallets: address[4]): #TODO implement
def __init__():
    self.relevantVotes = 1
    self.relevantWallets[msg.sender] = True
    self.ponce = INITIAL_PONCE

############################################################
#region exposedFunctions

############################################################
#region readOnlyFunctions
@external
@view
def getMaxWallets() -> uint256:
    return MAX_WALLETS


############################################################
@external
@view
def recoverAddressSig(_hash:bytes32, _signature:Bytes[65]) -> address:
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
def recoverAddressParams(_hash:bytes32, _v: uint256, _r:uint256, _s:uint256) -> address:
    return ecrecover(_hash, _v, _r, _s)


@external
@view
def getETHMessage96Hash(_message:Bytes[96]) -> bytes32:
    _ethMessageHash: bytes32 = keccak256(concat(PREFIX, _message))
    return _ethMessageHash

############################################################
@external
@view
def getWalletActionMessage(_wallet:address) -> Bytes[96]:
    _addressBytes32: bytes32 = convert(_wallet, bytes32)
    _sender: bytes32 = convert(msg.sender, bytes32)
    _messageBytes: Bytes[96] = concat(_addressBytes32, self.ponce, _sender)
    return _messageBytes

@external
@view
def getSendEtherMessage(_amount:uint256) -> Bytes[96]:
    _amountBytes32: bytes32 = convert(_amount, bytes32)
    _sender: bytes32 = convert(msg.sender, bytes32)
    _messageBytes: Bytes[96] = concat(_amountBytes32, self.ponce, _sender)
    return _messageBytes

@external
@view
def getTransactionMessage(_transaction: Bytes[1024]) -> Bytes[96]:
    _transactionHash: bytes32 = keccak256(_transaction)
    _sender: bytes32 = convert(msg.sender, bytes32)
    _messageBytes: Bytes[96] = concat(_transactionHash, self.ponce, _sender)
    return _messageBytes



#endregion

############################################################
#region writeFunctions

############################################################
#region add/remove wallets
@external
def addRelevantWallet(_wallet:address, _vs:uint256[5], _rs:uint256[5], _ss:uint256[5]) -> bool:
    if self.relevantWallets[_wallet]:
        return True
    assert _wallet != ZERO_ADDRESS
    _requiredVotes: uint256 = self.relevantVotes
    assert _requiredVotes < MAX_WALLETS 

    _approvers: address[5] = [ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS]
    _approvals: uint256 = 0
    
    _sender: bytes32 = convert(msg.sender, bytes32)
    _hash: bytes32 = keccak256(concat(PREFIX, convert(_wallet, bytes32), self.ponce, _sender))

    _addr: address = ZERO_ADDRESS

    if self.relevantWallets[msg.sender]:
        self.relevantWallets[msg.sender] = False # no double vote!
        _approvers[_approvals] = msg.sender
        _approvals += 1
    
    ########################################################
    for i in range(5):
        if _ss[i] == 0:
            break
        _addr = ecrecover(_hash, _vs[i], _rs[i], _ss[i])
        if self.relevantWallets[_addr]: # on ZERO_ADDRESS this will never be True
            self.relevantWallets[_addr] = False # no double vote!
            _approvers[_approvals] = _addr
            _approvals += 1

    ########################################################
    assert _approvals == _requiredVotes
    #  Hurray! Everybody approved!    
    
    ########################################################
    # give back vote privilege to relevant Voters
    for _approver in _approvers:
        if _approver == ZERO_ADDRESS:
            break
        else:
            self.relevantWallets[_approver] = True
    
    ########################################################
    self.relevantWallets[_wallet] = True
    self.relevantVotes = _requiredVotes + 1
    log WalletAdded(_wallet, self.ponce)
    self.ponce = _hash
    return True


# @external
# def addRelevantWallet(_wallet:address, _signatures: Bytes[325]) -> bool:
#     if self.relevantWallets[_wallet]:
#         return True
#     assert _wallet != ZERO_ADDRESS
#     _requiredVotes: uint256 = self.relevantVotes
#     assert _requiredVotes < MAX_WALLETS 

#     _approvers: address[5] = [ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS]
#     _approvals: uint256 = 0
    
#     _sender: bytes32 = convert(msg.sender, bytes32)
#     _hash: bytes32 = keccak256(concat(PREFIX, convert(_wallet, bytes32), self.ponce, _sender))

#     _v: uint256 = 0
#     _r: uint256 = 0
#     _s: uint256 = 0

#     _addr: address = ZERO_ADDRESS
#     _len: int128 = convert(len(_signatures), int128)

#     if self.relevantWallets[msg.sender]:
#         self.relevantWallets[msg.sender] = False # no double vote!
#         _approvers[_approvals] = msg.sender
#         _approvals += 1
    
#     ########################################################
#     for i in [0,65,130,195,260]:
#         if _len < i+65:
#             break
#         _r = extract32(_signatures, i, output_type=uint256)
#         _s = extract32(_signatures, i+32, output_type=uint256)
#         _v = extract32(_signatures, i+33, output_type=uint256)
#         _v = bitwise_and(_v, V_MASK)
#         _addr = ecrecover(_hash, _v, _r, _s)
#         if self.relevantWallets[_addr]: # on ZERO_ADDRESS this will never be True
#             self.relevantWallets[_addr] = False # no double vote!
#             _approvers[_approvals] = _addr
#             _approvals += 1

#     ########################################################
#     assert _approvals == _requiredVotes
#     #  Hurray! Everybody approved!    
    
#     ########################################################
#     # give back vote privilege to relevant Voters
#     for _approver in _approvers:
#         if _approver == ZERO_ADDRESS:
#             break
#         else:
#             self.relevantWallets[_approver] = True
    
#     ########################################################
#     self.relevantWallets[_wallet] = True
#     self.relevantVotes = _requiredVotes + 1
#     log WalletAdded(_wallet, self.ponce)
#     self.ponce = _hash
#     return True

@external
def removeRelevantWallet(_wallet: address, _signatures: Bytes[325]) -> bool:
    if not self.relevantWallets[_wallet]:
        return True
    assert _wallet != ZERO_ADDRESS
    _requiredVotes: uint256 = self.relevantVotes
    assert _requiredVotes > 2 
    # we don't want a single wallet to be able to remove the other

    _approvers: address[5] = [ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS,ZERO_ADDRESS]
    _approvals: uint256 = 0
    
    _sender: bytes32 = convert(msg.sender, bytes32)
    _hash: bytes32 = keccak256(concat(PREFIX, convert(_wallet, bytes32), self.ponce, _sender))
    
    _v: uint256 = 0
    _r: uint256 = 0
    _s: uint256 = 0

    _addr: address = ZERO_ADDRESS
    _len: int128 = convert(len(_signatures), int128)

    ########################################################
    # preemptive exclusion from this vote
    self.relevantWallets[_wallet] = False
    _requiredVotes -= 1
    # self.relevantVotes = _requiredVotes - 1

    ########################################################
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
    assert _approvals == _requiredVotes
    #  Hurray! Everybody approved!    
    
    ########################################################
    # give back vote privilege to relevant Voters
    for _approver in _approvers:
        if _approver == ZERO_ADDRESS:
            break
        else:
            self.relevantWallets[_approver] = True

    self.relevantVotes = _requiredVotes
    log WalletRemoved(_wallet, self.ponce)
    self.ponce = _hash
    return True

#endregion




#endregion


# Events ###################################################
############################################################
event EtherSent:
    _wallet: indexed(address)
    _amount: uint256
    _nonce: indexed(bytes32)

event WalletAdded:
    _wallet: indexed(address)
    _nonce: indexed(bytes32)

event WalletRemoved:
    _wallet: indexed(address)
    _nonce: indexed(bytes32)

event TransactionExecuted:
    _nonce: indexed(bytes32)
