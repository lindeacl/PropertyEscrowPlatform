export const microcopy = {
  // Tooltips for advanced terms
  tooltips: {
    escrow: "An escrow is a secure holding account where funds are kept safely until all conditions of a sale are met. Think of it as a trusted middleman that protects both buyers and sellers.",
    polygon: "Polygon is a blockchain network that makes transactions faster and cheaper than Ethereum while maintaining the same security. Your funds are protected by blockchain technology.",
    smartContract: "A smart contract is like a digital agreement that automatically executes when conditions are met. No human intervention needed - it's programmed to be fair and transparent.",
    arbiter: "An arbiter is a neutral third party who can help resolve disputes if buyers and sellers disagree. They're like a digital judge for your transaction.",
    gasFeeBuy: "Gas fees are small transaction costs paid to the blockchain network. They're usually just a few cents and ensure your transaction is processed securely.",
    deadline: "The deadline is when the escrow automatically expires if not completed. This protects both parties from indefinite waiting.",
    kycVerification: "KYC (Know Your Customer) verification helps ensure all participants are legitimate, making transactions safer for everyone involved."
  },

  // Reassuring messages
  reassurance: {
    fundsSecure: "Your funds are securely held in a smart contract and cannot be accessed by anyone until all conditions are met.",
    blockchainProtected: "Protected by blockchain technology - the same security used by major financial institutions worldwide.",
    noMiddleman: "No bank or middleman can freeze or control your funds. The smart contract automatically handles everything.",
    instantWithdrawal: "Once conditions are met, funds are released instantly to your wallet - no waiting for bank transfers.",
    disputeProtection: "If there's a disagreement, a qualified arbiter will review the case and ensure a fair resolution.",
    transparentProcess: "Every action is recorded on the blockchain - you can verify everything independently.",
    lowCosts: "Blockchain technology eliminates most traditional fees, saving you money on your property transaction."
  },

  // Helpful explanations
  explanations: {
    escrowCreated: "Great! Your escrow has been created successfully. The buyer can now deposit funds to begin the property purchase process.",
    fundsDeposited: "Excellent! Funds have been securely deposited. The seller can now proceed with property transfer knowing payment is guaranteed.",
    documentsRequired: "Please upload property documents, inspection reports, and any other relevant files to keep all parties informed.",
    pendingApproval: "Waiting for the other party to approve. They'll receive a notification and can take action from their dashboard.",
    disputeRaised: "A dispute has been raised. Don't worry - an experienced arbiter will review all evidence and ensure a fair outcome.",
    transactionComplete: "Congratulations! Your property transaction has been completed successfully. Funds have been released to the seller.",
    refundProcessed: "Your refund has been processed and returned to your wallet. The transaction is now closed."
  },

  // Progress indicators
  progress: {
    step1: "Setting up your secure escrow account",
    step2: "Awaiting buyer's fund deposit",
    step3: "Funds secured - proceeding with property transfer",
    step4: "Finalizing transaction and releasing funds",
    step5: "Transaction completed successfully"
  },

  // Error messages (user-friendly)
  errors: {
    walletNotConnected: "Please connect your wallet to continue. We support MetaMask and other popular wallets.",
    insufficientFunds: "You don't have enough funds in your wallet for this transaction. Please add more funds and try again.",
    transactionFailed: "The transaction couldn't be completed. This is usually temporary - please try again in a moment.",
    networkError: "Connection issue detected. Please check your internet connection and try again.",
    invalidAddress: "This wallet address doesn't look right. Please double-check and enter a valid address.",
    documentUploadFailed: "Document upload failed. Please ensure your file is under 10MB and try again.",
    disputeAlreadyExists: "A dispute is already active for this escrow. Please wait for the arbiter's decision."
  },

  // Success messages
  success: {
    walletConnected: "Wallet connected successfully! You're ready to start using the platform.",
    escrowCreated: "Escrow created! The buyer will be notified and can now deposit funds.",
    fundsDeposited: "Funds deposited successfully! Your payment is now secure and guaranteed.",
    documentsUploaded: "Documents uploaded successfully. All parties can now view and download them.",
    transactionApproved: "Transaction approved! The escrow will proceed to the next step automatically.",
    disputeResolved: "Dispute resolved successfully. The transaction can now continue as planned.",
    fundsReleased: "Funds released! The transaction is complete and all parties have been notified."
  },

  // Action prompts
  actions: {
    connectWallet: "Connect your wallet to get started with secure property transactions",
    depositFunds: "Deposit funds to guarantee your property purchase and protect the seller",
    uploadDocuments: "Upload property documents to keep everyone informed and build trust",
    approveTransaction: "Review and approve to move the transaction to the next step",
    raiseDispute: "If there's an issue, raise a dispute and an arbiter will help resolve it",
    releaseFunds: "Release funds to complete the property sale and transfer ownership"
  }
};

export const getTooltipContent = (term: keyof typeof microcopy.tooltips): string => {
  return microcopy.tooltips[term] || '';
};

export const getReassurance = (key: keyof typeof microcopy.reassurance): string => {
  return microcopy.reassurance[key] || '';
};

export const getExplanation = (key: keyof typeof microcopy.explanations): string => {
  return microcopy.explanations[key] || '';
};