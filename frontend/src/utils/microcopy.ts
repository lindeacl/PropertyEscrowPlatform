/**
 * Microcopy and help text utilities for enhanced user experience
 */

// Friendly, clear messages for all user interactions
export const microcopy = {
  // Action confirmations
  confirmations: {
    escrowCreated: "Great! Your escrow has been created successfully. All parties will be notified.",
    fundsDeposited: "Perfect! Your funds are now securely held in escrow.",
    approvalGiven: "Thank you for your approval. The transaction is one step closer to completion.",
    fundsReleased: "Excellent! Funds have been released and the transaction is complete.",
    escrowCancelled: "The escrow has been cancelled and any deposited funds will be returned."
  },

  // Error messages - friendly and actionable
  errors: {
    walletNotConnected: "Please connect your wallet to continue with this transaction.",
    insufficientFunds: "You don't have enough funds for this transaction. Please check your balance.",
    networkError: "We're having trouble connecting to the blockchain. Please try again in a moment.",
    invalidAddress: "This wallet address doesn't look right. Please double-check and try again.",
    transactionFailed: "The transaction couldn't be completed. Please review the details and try again.",
    unauthorized: "You don't have permission to perform this action.",
    escrowNotFound: "We couldn't find this escrow. It may have been completed or cancelled.",
    deadlinePassed: "The deadline for this escrow has passed."
  },

  // Loading states
  loading: {
    connecting: "Connecting to your wallet...",
    creating: "Creating your escrow...",
    depositing: "Depositing funds securely...",
    approving: "Processing your approval...",
    releasing: "Releasing funds...",
    cancelling: "Cancelling escrow...",
    verifying: "Verifying transaction..."
  },

  // Success messages
  success: {
    connected: "Wallet connected successfully!",
    created: "Escrow created and ready for deposits",
    deposited: "Funds deposited and secured",
    approved: "Approval recorded successfully",
    released: "Transaction completed successfully",
    cancelled: "Escrow cancelled successfully"
  },

  // Warnings
  warnings: {
    deadlineApproaching: "This escrow expires soon. Please complete any pending actions.",
    largeAmount: "This is a large transaction. Please double-check all details.",
    irreversible: "This action cannot be undone. Please confirm you want to proceed.",
    networkFee: "Network fees will apply to this transaction.",
    experimental: "This feature is new. Please proceed with caution."
  }
};

// Tooltip content for technical terms and complex actions
export const getTooltipContent = (key: string): string => {
  const tooltips: Record<string, string> = {
    escrow: "A secure holding account where funds are kept until all conditions are met",
    smartContract: "Automated agreement that executes when conditions are fulfilled",
    gasFeе: "Small fee paid to process transactions on the blockchain",
    deadline: "Date by which all escrow conditions must be met",
    multiSig: "Requires multiple approvals before funds can be released",
    arbiter: "Neutral party who can resolve disputes if they arise",
    verification: "Process to confirm all escrow conditions have been met",
    platformFee: "Small service fee to maintain and improve the platform",
    blockchain: "Secure, transparent ledger that records all transactions",
    wallet: "Digital account that holds your cryptocurrency and tokens",
    deposit: "Funds placed into secure escrow until transaction completes",
    approval: "Confirmation that conditions have been met",
    release: "Final step where funds are transferred to the seller",
    cancellation: "Ending the escrow and returning funds to the buyer",
    dispute: "Process to resolve disagreements about transaction conditions"
  };

  return tooltips[key] || "Additional information about this feature";
};

// Reassuring messages to build trust
export const getReassurance = (context: string): string => {
  const reassurances: Record<string, string> = {
    fundsSecure: "Your funds are protected by smart contracts and cannot be accessed by anyone else",
    transparentProcess: "Every action is recorded on the blockchain for complete transparency",
    professionalSupport: "Our support team is available 24/7 to help with any questions",
    provenTechnology: "Built on battle-tested blockchain technology used by millions",
    regulatoryCompliant: "Fully compliant with financial regulations and security standards",
    rapidSupport: "Most issues are resolved within minutes, not hours",
    noHiddenFees: "All fees are clearly displayed upfront with no surprises",
    easyRefunds: "If something goes wrong, refunds are automatic and instant"
  };

  return reassurances[context] || "You're in safe hands with our secure platform";
};

// Step-by-step guidance for complex processes
export const getStepGuidance = (step: string): string => {
  const guidance: Record<string, string> = {
    connectWallet: "Click 'Connect Wallet' and select your preferred wallet from the list. Approve the connection when prompted.",
    createEscrow: "Fill in the property details, set the purchase price, and add all parties involved. Review everything carefully before submitting.",
    depositFunds: "Transfer the agreed amount to the escrow. Your funds will be held securely until all conditions are met.",
    verifyConditions: "Upload any required documents and confirm all conditions have been satisfied.",
    giveApproval: "Review the transaction details one final time, then approve to authorize fund release.",
    releaseCompletes: "Once approved by all parties, funds are automatically released and the transaction is complete."
  };

  return guidance[step] || "Follow the on-screen instructions to complete this step";
};

// Context-sensitive help text
export const getContextHelp = (context: string): string => {
  const contextHelp: Record<string, string> = {
    firstTime: "New to escrow? Don't worry - we'll guide you through each step.",
    returning: "Welcome back! Your previous transactions are available in your dashboard.",
    mobile: "Using mobile? Tap and hold any term for more information.",
    desktop: "Hover over any question mark icon for helpful explanations.",
    slow: "Network busy? Transactions may take a few extra minutes to process.",
    fast: "Network is fast today! Your transaction should complete quickly.",
    highValue: "For large transactions, we recommend extra verification steps.",
    international: "Cross-border transaction? Currency conversion happens automatically."
  };

  return contextHelp[context] || "Need help? Contact our support team anytime.";
};

// Progress indicators with encouraging messages
export const getProgressMessage = (step: number, total: number): string => {
  const progress = Math.round((step / total) * 100);
  
  if (progress < 25) return `Getting started... (${progress}% complete)`;
  if (progress < 50) return `Making great progress! (${progress}% complete)`;
  if (progress < 75) return `Almost there! (${progress}% complete)`;
  if (progress < 100) return `Final steps... (${progress}% complete)`;
  return "All done! 🎉";
};

// Accessibility announcements for screen readers
export const getA11yAnnouncement = (action: string): string => {
  const announcements: Record<string, string> = {
    modalOpened: "Dialog opened. Use Tab to navigate, Escape to close.",
    modalClosed: "Dialog closed. Focus returned to previous element.",
    formError: "Form contains errors. Please review the highlighted fields.",
    formSuccess: "Form submitted successfully.",
    pageLoaded: "Page loaded successfully.",
    actionCompleted: "Action completed successfully.",
    actionFailed: "Action failed. Please try again.",
    loading: "Loading in progress. Please wait.",
    networkIssue: "Network connection issue detected."
  };

  return announcements[action] || "Status update available.";
};