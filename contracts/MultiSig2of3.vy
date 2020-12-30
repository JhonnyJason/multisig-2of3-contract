# @version ^0.2.8

CONTRACT_TYPE: constant(String[12]) = "MultiSig2of3"
############################################################
WALLET_MISSING: constant(String[14]) = "Wallet Missing"

INVALID_SENDER: constant(String[14]) = "Invalid Sender"
INVALID_SIGNER: constant(String[17]) = "Invalid Signature"
SIGNER_IS_SENDER: constant(String[16]) = "Sender is Signer"

############################################################
PREFIX: constant(Bytes[28]) = 0x19457468657265756d205369676e6564204d6573736167653a0a3936

INITIAL_PONCE: constant(bytes32) = 0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef

############################################################
#region internalProperties

############################################################
isAuthorized: public(HashMap[address, bool])
incomplete: public(bool)
ponce: public(bytes32) # pattern only used once

#endregion

############################################################
@external
def __init__(_isAuthorized: address[3]):
    for _addr in _isAuthorized:
        assert _addr != ZERO_ADDRESS
        self.isAuthorized[_addr] = True
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
def isComplete() -> bool:
    return not self.incomplete

@external
@view
def type() -> String[12]:
    return CONTRACT_TYPE

############################################################
# @external
# @view
# def recoverAddressSig(_hash:bytes32, _signature:Bytes[65]) -> address:
#     _v: uint256 = 0
#     _r: uint256 = 0
#     _s: uint256 = 0
    
#     ########################################################
#     _r = extract32(_signature, 0, output_type=uint256)
#     _s = extract32(_signature, 32, output_type=uint256)
#     _v = extract32(_signature, 33, output_type=uint256)
#     _v = bitwise_and(_v, V_MASK)
#     return ecrecover(_hash, _v, _r, _s)

# @external
# @view
# def recoverAddress(_hash:bytes32, _v: uint256, _r:uint256, _s:uint256) -> address:
#     return ecrecover(_hash, _v, _r, _s)

############################################################
# @external
# @view
# def getETHMessage96Hash(_message:Bytes[96]) -> bytes32:
#     _ethMessageHash: bytes32 = keccak256(concat(PREFIX, _message))
#     return _ethMessageHash

# @external
# @view
# def getMessagePrefix() -> Bytes[28]:
#     return PREFIX

############################################################
# @external
# @view
# def getWalletActionMessage(_wallet:address) -> Bytes[96]:
#     _addressBytes32: bytes32 = convert(_wallet, bytes32)
#     _sender: bytes32 = convert(msg.sender, bytes32)
#     _messageBytes: Bytes[96] = concat(_addressBytes32, self.ponce, _sender)
#     return _messageBytes

# @external
# @view
# def getSendEtherMessage(_amount:uint256) -> Bytes[96]:
#     _amountBytes32: bytes32 = convert(_amount, bytes32)
#     _sender: bytes32 = convert(msg.sender, bytes32)
#     _messageBytes: Bytes[96] = concat(_amountBytes32, self.ponce, _sender)
#     return _messageBytes

# @external
# @view
# def getTransactionMessage(_target:address, _sent_value: uint256, _data: Bytes[256]) -> Bytes[96]:
#     _targetBytes: bytes32 = convert(_target, bytes32)
#     _valueBytes: bytes32 = convert(_sent_value, bytes32)
#     _messageHash: bytes32 = keccak256(concat(_targetBytes, _valueBytes, _data))
#     _sender: bytes32 = convert(msg.sender, bytes32)
#     _messageBytes: Bytes[96] = concat(_messageHash, self.ponce, _sender)
#     return _messageBytes

#endregion

############################################################
#region writeFunctions

############################################################
@external
def addAuthorizedWallet(_wallet:address, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert _wallet != ZERO_ADDRESS, "Cannot add ZERO_ADDRESS!"
    assert self.incomplete, "We already have all Wallets!"

    if self.isAuthorized[_wallet]:
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
    assert msg.sender != _signer, SIGNER_IS_SENDER
    assert self.isAuthorized[msg.sender], INVALID_SENDER
    assert self.isAuthorized[_signer], INVALID_SIGNER
    #  We have 2 approvers    
    
    ########################################################
    self.isAuthorized[_wallet] = True
    log WalletAdded(_wallet, self.ponce)
    self.ponce = _hash
    self.incomplete = False
    return True

############################################################
@external
def removeAuthorizedWallet(_wallet: address, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert not self.incomplete, WALLET_MISSING

    if not self.isAuthorized[_wallet]:
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
    assert msg.sender != _signer, SIGNER_IS_SENDER
    assert self.isAuthorized[msg.sender], INVALID_SENDER
    assert self.isAuthorized[_signer], INVALID_SIGNER
    #  Hurray! We have 2 distinct approvers!    
    
    ########################################################
    self.isAuthorized[_wallet] = False
    self.incomplete = True
    log WalletRemoved(_wallet, self.ponce)
    self.ponce = _hash
    return True

############################################################
@external
def sendEther(_to:address, _amount:uint256, _v:uint256, _r:uint256, _s:uint256) -> bool:
    assert not self.incomplete, WALLET_MISSING
    
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
    assert msg.sender != _signer, SIGNER_IS_SENDER
    assert self.isAuthorized[msg.sender], INVALID_SENDER
    assert self.isAuthorized[_signer], INVALID_SIGNER
    #  Hurray! We have 2 distinct approvers!    
    
    ########################################################
    send(_to, _amount)
    log EtherSent(_to, _amount, self.ponce)
    self.ponce = _hash
    return True

############################################################
@external
def doTransaction(_target:address, _sent_value: uint256, _data:Bytes[256], _v:uint256, _r:uint256, _s:uint256) -> Bytes[32]:
    assert not self.incomplete, WALLET_MISSING
    
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
    assert msg.sender != _signer, SIGNER_IS_SENDER
    assert self.isAuthorized[msg.sender], INVALID_SENDER
    assert self.isAuthorized[_signer], INVALID_SIGNER
    #  Hurray! We have 2 distinct approvers!    

    _result: Bytes[32] = raw_call(
        _target,
        _data,
        max_outsize=32,
        value=_sent_value
    )
    log TransactionExecuted(_target, self.ponce)
    self.ponce = _hash
    return _result

#endregion

# Events ###################################################
############################################################
event EtherSent:
    _to: indexed(address)
    _amount: uint256
    _ponce: indexed(bytes32)

event WalletAdded:
    _wallet: indexed(address)
    _ponce: indexed(bytes32)

event WalletRemoved:
    _wallet: indexed(address)
    _ponce: indexed(bytes32)

event TransactionExecuted:
    _target: indexed(address)
    _ponce: indexed(bytes32)
