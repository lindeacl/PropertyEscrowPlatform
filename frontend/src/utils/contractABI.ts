// Contract ABIs extracted from compiled artifacts
export const ESCROW_FACTORY_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "agent",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "arbiter",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "tokenAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "depositAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "agentFee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "platformFee",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "propertyId",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "description",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "salePrice",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "documentHash",
                "type": "string"
              },
              {
                "internalType": "bool",
                "name": "verified",
                "type": "bool"
              }
            ],
            "internalType": "struct EscrowStructs.Property",
            "name": "property",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "depositDeadline",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "verificationDeadline",
            "type": "uint256"
          }
        ],
        "internalType": "struct EscrowStructs.CreateEscrowParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "createEscrow",
    "outputs": [
      {
        "internalType": "address",
        "name": "escrowContract",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "escrowId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEscrowCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "escrowId",
        "type": "uint256"
      }
    ],
    "name": "getEscrowContract",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "whitelisted",
        "type": "bool"
      }
    ],
    "name": "whitelistToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "isTokenWhitelisted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "escrowContract",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "escrowId",
        "type": "uint256"
      }
    ],
    "name": "EscrowContractDeployed",
    "type": "event"
  }
];

export const PROPERTY_ESCROW_ABI = [
  "function buyer() external view returns (address)",
  "function seller() external view returns (address)",
  "function arbiter() external view returns (address)",
  "function amount() external view returns (uint256)",
  "function token() external view returns (address)",
  "function status() external view returns (uint8)",
  "function deposit() external payable",
  "function release() external",
  "function cancel() external"
];

export const MOCK_ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external"
];