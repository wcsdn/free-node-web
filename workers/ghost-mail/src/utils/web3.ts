/**
 * Web3 工具函数 - 链上交易验证
 * 使用 Base Mainnet RPC 直接验证，无需 API Key
 */

interface Env {
  TREASURY_ADDRESS: string;
}

/**
 * 验证交易是否有效
 * 使用 Base 官方 RPC (https://mainnet.base.org)
 */
export async function verifyTransaction(
  txHash: string,
  userAddress: string,
  env: Env
): Promise<boolean> {
  try {
    const BASE_RPC = 'https://mainnet.base.org';

    // 使用 JSON-RPC 调用 eth_getTransactionByHash
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json() as { result?: any };
    const tx = data.result;

    if (!tx) {
      console.error('Transaction not found:', txHash);
      return false;
    }

    // 验证三要素：
    // 1. 发送方是用户
    // 2. 接收方是收款地址
    // 3. 金额 >= 0.001 ETH (1e15 Wei = 0x38D7EA4C68000)
    const isValid =
      tx.from.toLowerCase() === userAddress.toLowerCase() &&
      tx.to.toLowerCase() === env.TREASURY_ADDRESS.toLowerCase() &&
      BigInt(tx.value) >= BigInt('1000000000000000'); // 0.001 ETH

    if (!isValid) {
      console.error('Transaction validation failed:', {
        txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        expected: {
          from: userAddress,
          to: env.TREASURY_ADDRESS,
          minValue: '0.001 ETH (1000000000000000 Wei)',
        },
      });
    } else {
      console.log('Transaction verified successfully:', {
        txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
      });
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

/**
 * 验证以太坊主网交易（备用）
 * 使用公共 RPC
 */
export async function verifyEthereumTransaction(
  txHash: string,
  userAddress: string,
  env: Env
): Promise<boolean> {
  try {
    const ETH_RPC = 'https://eth.llamarpc.com'; // 公共 RPC

    const response = await fetch(ETH_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json() as { result?: any };
    const tx = data.result;
    if (!tx) return false;

    const isValid =
      tx.from.toLowerCase() === userAddress.toLowerCase() &&
      tx.to.toLowerCase() === env.TREASURY_ADDRESS.toLowerCase() &&
      BigInt(tx.value) >= BigInt('1000000000000000');

    return isValid;
  } catch (error) {
    console.error('Error verifying Ethereum transaction:', error);
    return false;
  }
}

/**
 * 验证 Optimism 交易（备用）
 * 使用公共 RPC
 */
export async function verifyOptimismTransaction(
  txHash: string,
  userAddress: string,
  env: Env
): Promise<boolean> {
  try {
    const OP_RPC = 'https://mainnet.optimism.io'; // Optimism 官方 RPC

    const response = await fetch(OP_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json() as { result?: any };
    const tx = data.result;
    if (!tx) return false;

    const isValid =
      tx.from.toLowerCase() === userAddress.toLowerCase() &&
      tx.to.toLowerCase() === env.TREASURY_ADDRESS.toLowerCase() &&
      BigInt(tx.value) >= BigInt('1000000000000000');

    return isValid;
  } catch (error) {
    console.error('Error verifying Optimism transaction:', error);
    return false;
  }
}
