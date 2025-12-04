export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // App
    wakeUp: '> Wake up, Neo...',
    matrixHasYou: '> The Matrix has you...',
    followRabbit: '> Follow the white rabbit.',
    walletConnected: '✅ Wallet Connected',
    address: 'Address:',
    network: 'Network:',
    balance: 'Balance:',
    
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
    waitingSignature: 'Waiting for signature...',
    confirming: 'Confirming...',
    transactionSuccess: 'Transaction Success ✓',
    viewTransaction: 'View Transaction ↗',
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
  },
  zh: {
    // App
    wakeUp: '> 醒醒，Neo...',
    matrixHasYou: '> 矩阵拥有你...',
    followRabbit: '> 跟随白兔。',
    walletConnected: '✅ 钱包已连接',
    address: '地址:',
    network: '网络:',
    balance: '余额:',
    
    // Guestbook
    intrusionSystem: '> 入侵检测系统',
    leaveYourMark: '> 在矩阵中留下你的印记...',
    signatureRequired: '> 首次留言需要签名（无 Gas 费用）',
    signatureVerified: '> 已验证 ✓ - 无需签名',
    yourMessage: '> 你的留言（最多 100 字符）:',
    enterMessage: '输入你的留言...',
    signing: '[ 签名中... ]',
    submitting: '[ 提交中... ]',
    signAndSubmit: '[ 签名并提交 ]',
    sendMessage: '[ 发送留言 ]',
    sendReply: '[ 发送回复 ]',
    detectedIntrusions: '条入侵',
    noIntrusions: '> 暂无入侵记录...',
    replyingTo: '> 回复给:',
    replyTo: '> 回复',
    deleteAll: '全部',
    unsafeContent: '⚠️ 留言包含不安全内容，请移除 HTML 标签、脚本或特殊字符。',
    emptyMessage: '⚠️ 留言不能为空。',
    
    // VIP Content
    vipAccess: 'VIP 访问已授权',
    exclusiveContent: '独家内容',
    vipMessage: '欢迎来到矩阵的内部圈子。',
    permissionVerification: '🔒 权限验证',
    ethBalance: 'ETH:',
    requirementHint: '(需要 ≥ 0.01 ETH)',
    usdtAssets: 'USDT 资产:',
    loadingBalance: '加载中...',
    switchToMainnet: 'N/A (请切换到以太坊主网)',
    
    // Donate
    feedRabbit: '🥕 喂养兔子',
    donate: '捐赠',
    waitingSignature: '等待签名...',
    confirming: '确认中...',
    transactionSuccess: '交易成功 ✓',
    viewTransaction: '查看交易 ↗',
    userCancelled: '用户取消了交易',
    insufficientBalance: '余额不足',
    transactionFailed: '交易失败',
    
    // News Terminal
    hackerNews: '🔥 黑客新闻热榜',
    clickToView: '> 点击新闻标题查看详情',
    loading: '正在加载数据...',
    loadingMore: '> 正在加载...',
    loadMore: '> [ 加载更多新闻 ]',
    noMoreNews: '> 已经到底了，没有更多新闻了',
    loadFailed: '> 加载失败，已经没有更多新闻了',
    
    // Rabbit
    switchStyle: '切换风格:',
    classic: '经典圆润',
    geometric: '几何棱角',
    minimal: '极简线条',
    hacker: '黑客代码',
  },
};

export const getTranslation = (lang: Language, key: keyof typeof translations.en): string => {
  return translations[lang][key] || translations.en[key];
};
