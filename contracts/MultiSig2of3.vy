# @version ^0.2.8

############################################################
V_MASK: constant(uint256) = 255

PREFIX: constant(Bytes[28]) = 0x19457468657265756d205369676e6564204d6573736167653a0a3936

INITIAL_PONCE: constant(bytes32) = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef

############################################################
#region internalProperties

############################################################
relevantWallets: public(HashMap[address, bool])
hasNotAllWallets: public(bool)
ponce: public(bytes32) # pattern used once

#endregion

############################################################
@external
def __init__(_relevantWallets: address[3]):
    for _addr in _relevantWallets:
        assert _addr != ZERO_ADDRESS
        self.relevantWallets[_addr] = True
    self.hasNotAllWallets = False
    self.ponce = INITIAL_PONCE

############################################################
#region exposedFunctions

############################################################
#region readOnlyFunctions
@external
@view
def hasAllWallets() -> bool:
    return not self.hasNotAllWallets

@external
@view
def getMaxWallets() -> uint256:
    return 3

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
def recoverAddress(_hash:bytes32, _v: uint256, _r:uint256, _s:uint256) -> address:
    return ecrecover(_hash, _v, _r, _s)

############################################################
@external
@view
def getETHMessage96Hash(_message:Bytes[96]) -> bytes32:
    _ethMessageHash: bytes32 = keccak256(concat(PREFIX, _message))
    return _ethMessageHash

@external
@view
def getMessagePrefix() -> Bytes[28]:
    return PREFIX

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
def addRelevantWallet(_wallet:address, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert _wallet != ZERO_ADDRESS, "Cannot add ZERO_ADDRESS!"
    assert self.hasNotAllWallets, "We alread have all Wallets!"

    if self.relevantWallets[_wallet]:
        return True

    _sender: bytes32 = convert(msg.sender, bytes32)
    _hash: bytes32 = keccak256(concat(
        PREFIX, 
        convert(_wallet, bytes32), 
        self.ponce, 
        _sender
        ))

    _signer: address = ecrecover(_hash, _v, _r, _s)

    ########################################################
    assert msg.sender != _signer, "Sender is supposed to not be the signer!"
    assert self.relevantWallets[msg.sender], "Sender has no Authority here!"
    assert self.relevantWallets[_signer], "Signer has no Authority here!"
    #  We have 2 approvers    
    
    ########################################################
    self.relevantWallets[_wallet] = True
    log WalletAdded(_wallet, self.ponce)
    self.ponce = _hash
    self.hasNotAllWallets = False
    return True

############################################################
@external
def removeRelevantWallet(_wallet: address, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert not self.hasNotAllWallets, "There is already a wallet missing!"

    if not self.relevantWallets[_wallet]:
        return True
 
    _sender: bytes32 = convert(msg.sender, bytes32)
    _hash: bytes32 = keccak256(concat(
        PREFIX, 
        convert(_wallet, bytes32), 
        self.ponce, 
        _sender
        ))

    _signer: address = ecrecover(_hash, _v, _r, _s)

    ########################################################
    assert msg.sender != _signer, "Sender is supposed to not be the signer!"
    assert self.relevantWallets[msg.sender], "Sender has no Authority here!"
    assert self.relevantWallets[_signer], "Signer has no Authority here!"
    #  Hurray! We have 2 distinct approvers!    
    
    ########################################################
    self.relevantWallets[_wallet] = False
    self.hasNotAllWallets = True
    log WalletRemoved(_wallet, self.ponce)
    self.ponce = _hash
    return True

#endregion

@external
def sendEther(_amount:uint256 , _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert not self.hasNotAllWallets, "There is a wallet missing!"
 
    _sender: bytes32 = convert(msg.sender, bytes32)
    _hash: bytes32 = keccak256(concat(
        PREFIX, 
        convert(_wallet, bytes32), 
        self.ponce, 
        _sender
        ))

    _signer: address = ecrecover(_hash, _v, _r, _s)

    ########################################################
    assert msg.sender != _signer, "Sender is supposed to not be the signer!"
    assert self.relevantWallets[msg.sender], "Sender has no Authority here!"
    assert self.relevantWallets[_signer], "Signer has no Authority here!"
    #  Hurray! We have 2 distinct approvers!    
    
    ########################################################
    self.relevantWallets[_wallet] = False
    self.hasNotAllWallets = True
    log EtherSent(_amount, self.ponce)
    self.ponce = _hash
    return True




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
