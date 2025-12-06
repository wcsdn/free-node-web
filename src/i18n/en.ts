// English translations
export const en = {
  // App
  wakeUp: '> Wake up, Neo...',
  matrixHasYou: '> The Matrix has you...',
  followRabbit: '> Follow the white rabbit.',
  walletConnected: '✅ Wallet Connected',
  guestMode: 'Guest Mode',
  guestModeHint: 'Connect wallet to unlock donation & VIP features',
  aboutMe: 'About Me',
  profileData: '> PROFILE DATA',
  ghostMail: 'Ghost Mail',
  address: 'Address:',
  network: 'Network:',
  balance: 'Balance:',
  
  // Ghost Mail
  accessRequired: 'ACCESS REQUIRED',
  accessDenied: 'ACCESS DENIED',
  vipRequired: 'VIP access required to use Ghost Mail',
  connectWalletToAccess: 'Please connect your wallet to access Ghost Mail',
  verifyingAccess: 'Verifying access...',
  payToUnlock: 'Pay 0.001 ETH',
  completeTask: 'Complete Task',
  upgradeToVIP: 'Upgrade to VIP',
  sendPayment: 'Send Payment',
  viewTransaction: 'View Transaction ↗',
  waitingForSignature: 'Waiting for signature...',
  confirming: 'Confirming...',
  
  // Guestbook
  intrusionSystem: '> INTRUSION DETECTION SYSTEM',
  leaveYourMark: '> Leave your mark in the Matrix...',
  signatureRequired: '> First message requires signature (No Gas)',
  signatureVerified: '> Verified ✓ - No signature required',
  yourMessage: '> Your Message (max 100 chars):',
  enterMessage: 'Enter your message...',
  signing: '[ SIGNING... ]',
  submitting: '[ SUBMITTING... ]',
  signAndSubmit: '[ SIGN & SUBMIT ]',
  sendMessage: '[ SEND MESSAGE ]',
  sendReply: '[ SEND REPLY ]',
  detectedIntrusions: 'intrusions',
  noIntrusions: '> No intrusions detected yet...',
  replyingTo: '> Replying to:',
  replyTo: '> Reply to',
  deleteAll: 'ALL',
  connectWalletFirst: '⚠️ Please connect your wallet first to leave a message.',
  unsafeContent: '⚠️ Message contains unsafe content. Please remove HTML tags, scripts, or special characters.',
  emptyMessage: '⚠️ Message cannot be empty.',
  
  // VIP Content
  vipAccess: 'VIP ACCESS GRANTED',
  exclusiveContent: 'Exclusive Content',
  vipMessage: 'Welcome to the inner circle of the Matrix.',
  permissionVerification: '🔒 Permission Verification',
  ethBalance: 'ETH:',
  requirementHint: '(Requires ≥ 0.01 ETH)',
  usdtAssets: 'USDT Assets:',
  loadingBalance: 'Loading...',
  switchToMainnet: 'N/A (Please switch to Ethereum Mainnet)',
  
  // Donate
  feedRabbit: '🥕 Feed the Rabbit',
  donate: 'Donate',
  transactionSuccess: 'Transaction Success ✓',
  userCancelled: 'User cancelled transaction',
  insufficientBalance: 'Insufficient balance',
  transactionFailed: 'Transaction failed',
  
  // News Terminal
  hackerNews: '🔥 HACKER NEWS',
  clickToView: '> Click news title to view details',
  loading: 'Loading data...',
  loadingMore: '> Loading...',
  loadMore: '> [ LOAD MORE NEWS ]',
  noMoreNews: '> No more news',
  loadFailed: '> Load failed, no more news',
  
  // Rabbit
  switchStyle: 'Switch Style:',
  classic: 'Classic',
  geometric: 'Geometric',
  minimal: 'Minimal',
  hacker: 'Hacker',
} as const;

export type TranslationKey = keyof typeof en;
