# @version ^0.2.8

############################################################
privateCounts: HashMap[address, uint256]

############################################################
@external
def __init__():
    return

############################################################
@external
@view
def getPrivateCounts(_addr: address) -> uint256:
    return self.privateCounts[_addr]

@external
@view
def doIwork() -> bool:
    return True

############################################################
@external
def plusplus() -> uint256:
    self.privateCounts[msg.sender] += 1
    return self.privateCounts[msg.sender]

@external
def addANumber(_a:uint256) -> uint256:
    self.privateCounts[msg.sender] += _a
    return self.privateCounts[msg.sender]

@external
def addTwoNumbers(_a:uint256, _b:uint256) -> uint256:
    self.privateCounts[msg.sender] += _a + _b
    return self.privateCounts[msg.sender]

@external
def addThreeNumbers(_a:uint256, _b:uint256, _c:uint256) -> uint256:
    self.privateCounts[msg.sender] += _a + _b + _c
    return self.privateCounts[msg.sender]

@external
def addFourNumbers(_a:uint256, _b:uint256, _c:uint256, _d:uint256) -> uint256:
    self.privateCounts[msg.sender] += _a + _b + _c + _d
    return self.privateCounts[msg.sender]
