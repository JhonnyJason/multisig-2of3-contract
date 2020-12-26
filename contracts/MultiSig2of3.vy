# @version ^0.2.8

############################################################
V_MASK: constant(uint256) = 255

PREFIX: constant(Bytes[28]) = 0x19457468657265756d205369676e6564204d6573736167653a0a3936

INITIAL_PONCE: constant(bytes32) = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef

############################################################
#region internalProperties

############################################################
relevantWallets: public(HashMap[address, bool])
incomplete: public(bool)
ponce: public(bytes32) # pattern used once

#endregion

############################################################
@external
def __init__(_relevantWallets: address[3]):
    for _addr in _relevantWallets:
        assert _addr != ZERO_ADDRESS
        self.relevantWallets[_addr] = True
    self.incomplete = False
    self.ponce = INITIAL_PONCE

@external
@payable
def __default__():
    return

############################################################
#region exposedFunctions

############################################################
#region readOnlyFunctions
@external
@view
def hasAllWallets() -> bool:
    return not self.incomplete

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

@external
@view
def getTransactionMessageB(_target:address, _sent_value: uint256, _data: Bytes[1024]) -> Bytes[96]:
    _targetBytes: bytes32 = convert(_target, bytes32)
    _valueBytes: bytes32 = convert(_sent_value, bytes32)
    _messageHash: bytes32 = keccak256(concat(_targetBytes, _valueBytes, _data))
    _sender: bytes32 = convert(msg.sender, bytes32)
    _messageBytes: Bytes[96] = concat(_messageHash, self.ponce, _sender)
    return _messageBytes


#endregion

############################################################
#region writeFunctions

############################################################
#region add/remove wallets
@external
def addRelevantWallet(_wallet:address, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert _wallet != ZERO_ADDRESS, "Cannot add ZERO_ADDRESS!"
    assert self.incomplete, "We alread have all Wallets!"

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
    self.incomplete = False
    return True

############################################################
@external
def removeRelevantWallet(_wallet: address, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert not self.incomplete, "There is already a wallet missing!"

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
    self.incomplete = True
    log WalletRemoved(_wallet, self.ponce)
    self.ponce = _hash
    return True

#endregion

@external
def sendEther(_to:address, _amount:uint256, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert not self.incomplete, "There is a wallet missing!"
    
    #TODO we might also want to lock the _to address 
    _sender: bytes32 = convert(msg.sender, bytes32)
    _hash: bytes32 = keccak256(concat(
        PREFIX, 
        convert(_amount, bytes32), 
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
    send(_to, _amount)
    log EtherSent(_to, _amount, self.ponce)
    self.ponce = _hash
    return True

@external
def doTransaction(_transaction:Bytes[1024], _v:uint256, _r:uint256, _s:uint256) -> Bytes[32]:
    assert not self.incomplete, "There is a wallet missing!"
    
    _sender: bytes32 = convert(msg.sender, bytes32)
    _hash: bytes32 = keccak256(concat(
        PREFIX, 
        keccak256(_transaction), 
        self.ponce, 
        _sender
        ))

    _signer: address = ecrecover(_hash, _v, _r, _s)

    ########################################################
    assert msg.sender != _signer, "Sender is supposed to not be the signer!"
    assert self.relevantWallets[msg.sender], "Sender has no Authority here!"
    assert self.relevantWallets[_signer], "Signer has no Authority here!"
    #  Hurray! We have 2 distinct approvers!    

    _to: address = extract32(_transaction, 0, output_type=address)
    _value: uint256 = extract32(_transaction, 32, output_type=uint256)
    _len: uint256 = len(_transaction) - 64
    _data: Bytes[1024] = slice(_transaction, 64, _len)

    return raw_call(
        _to,
        _data,
        max_outsize=32,
        value=_value
    )
    
@external
def doTransactionB(_target:address, _sent_value: uint256, _data:Bytes[1024], _v:uint256, _r:uint256, _s:uint256) -> Bytes[32]:
    assert not self.incomplete, "There is a wallet missing!"
    
    _sender: bytes32 = convert(msg.sender, bytes32)
    _targetBytes: bytes32 = convert(_target, bytes32)
    _valueBytes: bytes32 = convert(_sent_value, bytes32)
    _messageHash: bytes32 = keccak256(concat(_targetBytes, _valueBytes, _data))

    _hash: bytes32 = keccak256(concat(
        PREFIX, 
        _messageHash, 
        self.ponce, 
        _sender
        ))

    _signer: address = ecrecover(_hash, _v, _r, _s)

    ########################################################
    assert msg.sender != _signer, "Sender is supposed to not be the signer!"
    assert self.relevantWallets[msg.sender], "Sender has no Authority here!"
    assert self.relevantWallets[_signer], "Signer has no Authority here!"
    #  Hurray! We have 2 distinct approvers!    

    return raw_call(
        _target,
        _data,
        max_outsize=32,
        value=_sent_value
    )

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
