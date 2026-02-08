/**
 * Free-Node Web Game - End-to-End API Integration Test
 * Tests all game API endpoints for completeness
 */

const API_BASE = 'http://127.0.0.1:8788';

// Test wallet (for auth headers)
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f7b7b2';
const TEST_SIGNATURE = 'test_signature_123';

// Helper function to make requests
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Wallet-Auth': `${TEST_WALLET}:${TEST_SIGNATURE}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    const result = fn();
    if (result.success) {
      results.passed++;
      results.tests.push({ name, status: '✅ PASS', details: result.details });
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      results.tests.push({ name, status: '❌ FAIL', details: result.details });
      console.log(`❌ ${name}: ${result.details}`);
    }
  } catch (err) {
    results.failed++;
    results.tests.push({ name, status: '❌ ERROR', details: err.message });
    console.log(`❌ ${name}: ${err.message}`);
  }
}

// ==================== API TESTS ====================

async function runTests() {
  console.log('\n🧪 Free-Node Web Game - API Integration Tests\n');
  console.log('='.repeat(50));

  // 1. Character/Auth Tests
  console.log('\n📋 1. Character & Auth Tests\n');
  
  test('GET /character - Get character info', async () => {
    const res = await request('/api/character');
    return {
      success: res.status === 200 && res.data.success,
      details: res.data.data ? `Name: ${res.data.data.name}, Level: ${res.data.data.level}` : 'No data'
    };
  });

  // 2. City Tests
  console.log('\n🏙️ 2. City Tests\n');
  
  test('GET /city - Get city info', async () => {
    const res = await request('/api/city');
    return {
      success: res.status === 200 && res.data.success,
      details: res.data.data ? `City ID: ${res.data.data.id}, Level: ${res.data.data.level}` : 'No data'
    };
  });

  test('GET /city/buildings - Get buildings', async () => {
    const res = await request('/api/city/buildings');
    return {
      success: res.status === 200 && res.data.success,
      details: `Buildings: ${res.data.data?.length || 0}`
    };
  });

  // 3. Hero Tests
  console.log('\n🦸 3. Hero Tests\n');
  
  test('GET /hero - Get hero list', async () => {
    const res = await request('/api/hero');
    return {
      success: res.status === 200 && res.data.success,
      details: `Heroes: ${res.data.data?.length || 0}`
    };
  });

  // 4. Building Tests
  console.log('\n🏗️ 4. Building Tests\n');
  
  test('GET /building - Get building list', async () => {
    const res = await request('/api/building');
    return {
      success: res.status === 200 && res.data.success,
      details: `Buildings: ${res.data.data?.length || 0}`
    };
  });

  // 5. Corps Tests
  console.log('\n⚔️ 5. Corps Tests\n');
  
  test('GET /corps - Get corps list', async () => {
    const res = await request('/api/corps');
    return {
      success: res.status === 200 && res.data.success,
      details: `Corps: ${res.data.data?.length || 0}`
    };
  });

  test('POST /corps - Create corps', async () => {
    const res = await request('/api/corps', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Corps', cityId: 1, formation: 0 })
    });
    return {
      success: res.status === 200 && res.data.success,
      details: res.data.data ? `Corps ID: ${res.data.data.id}` : res.data.error
    };
  });

  // 6. Battle Tests
  console.log('\n⚔️ 6. Battle Tests\n');
  
  test('GET /battle - Get battle records', async () => {
    const res = await request('/api/battle');
    return {
      success: res.status === 200 && res.data.success,
      details: `Battles: ${res.data.data?.length || 0}`
    };
  });

  // 7. Task Tests
  console.log('\n📜 7. Task Tests\n');
  
  test('GET /task - Get task list', async () => {
    const res = await request('/api/task');
    return {
      success: res.status === 200 && res.data.success,
      details: `Tasks: ${res.data.data?.length || 0}`
    };
  });

  // 8. Mail Tests
  console.log('\n📧 8. Mail Tests\n');
  
  test('GET /mail - Get mail list', async () => {
    const res = await request('/api/mail');
    return {
      success: res.status === 200 && res.data.success,
      details: `Mails: ${res.data.data?.length || 0}`
    };
  });

  // 9. Shop Tests
  console.log('\n🛒 9. Shop Tests\n');
  
  test('GET /shop - Get shop items', async () => {
    const res = await request('/api/shop');
    return {
      success: res.status === 200 && res.data.success,
      details: `Items: ${Object.keys(res.data.data || {}).length}`
    };
  });

  // 10. Arena/Rank Tests
  console.log('\n🏆 10. Arena & Ranking Tests\n');
  
  test('GET /arena - Get arena info', async () => {
    const res = await request('/api/arena');
    return {
      success: res.status === 200 && res.data.success,
      details: res.data.data ? `Rank: ${res.data.data.rank}, Score: ${res.data.data.score}` : 'No data'
    };
  });

  test('GET /rank - Get ranking list', async () => {
    const res = await request('/api/rank');
    return {
      success: res.status === 200 && res.data.success,
      details: `Players: ${res.data.data?.length || 0}`
    };
  });

  // 11. Dungeon Tests
  console.log('\n🗺️ 11. Dungeon Tests\n');
  
  test('GET /dungeon - Get dungeon list', async () => {
    const res = await request('/api/dungeon');
    return {
      success: res.status === 200 && res.data.success,
      details: `Dungeons: ${res.data.data?.length || 0}`
    };
  });

  // 12. Item/Inventory Tests
  console.log('\n🎒 12. Item & Inventory Tests\n');
  
  test('GET /item - Get inventory', async () => {
    const res = await request('/api/item');
    return {
      success: res.status === 200 && res.data.success,
      details: `Items: ${res.data.data?.length || 0}`
    };
  });

  // 13. Skill Tests
  console.log('\n✨ 13. Skill Tests\n');
  
  test('GET /skill - Get skill list', async () => {
    const res = await request('/api/skill');
    return {
      success: res.status === 200 && res.data.success,
      details: `Skills: ${res.data.data?.length || 0}`
    };
  });

  // 14. Tech Tests
  console.log('\n🔬 14. Technology Tests\n');
  
  test('GET /tech - Get tech tree', async () => {
    const res = await request('/api/tech');
    return {
      success: res.status === 200 && res.data.success,
      details: `Techs: ${res.data.data?.length || 0}`
    };
  });

  // 15. Daily/Signin Tests
  console.log('\n📅 15. Daily & Signin Tests\n');
  
  test('GET /daily - Get daily info', async () => {
    const res = await request('/api/daily');
    return {
      success: res.status === 200 && res.data.success,
      details: res.data.data ? `Signed: ${res.data.data.signedIn}, Streak: ${res.data.data.streak}` : 'No data'
    };
  });

  test('GET /signin - Get signin info', async () => {
    const res = await request('/api/signin');
    return {
      success: res.status === 200 && res.data.success,
      details: res.data.data ? `Days: ${res.data.data.signinDays}` : 'No data'
    };
  });

  // 16. Notification Tests
  console.log('\n🔔 16. Notification Tests\n');
  
  test('GET /notification - Get notifications', async () => {
    const res = await request('/api/notification');
    return {
      success: res.status === 200 && res.data.success,
      details: `Notifications: ${res.data.data?.length || 0}`
    };
  });

  // 17. Chat Tests
  console.log('\n💬 17. Chat Tests\n');
  
  test('GET /chat - Get chat messages', async () => {
    const res = await request('/api/chat');
    return {
      success: res.status === 200 && res.data.success,
      details: `Messages: ${res.data.data?.length || 0}`
    };
  });

  // 18. Defense Tests
  console.log('\n🛡️ 18. Defense Tests\n');
  
  test('GET /defense - Get defense info', async () => {
    const res = await request('/api/defense');
    return {
      success: res.status === 200 && res.data.success,
      details: res.data.data ? `Walls: ${res.data.data.wallLevel}, Traps: ${res.data.data.trapCount}` : 'No data'
    };
  });

  // 19. Military Tests
  console.log('\n🎖️ 19. Military Tests\n');
  
  test('GET /military - Get military info', async () => {
    const res = await request('/api/military');
    return {
      success: res.status === 200 && res.data.success,
      details: `Troops: ${res.data.data?.length || 0}`
    };
  });

  // 20. Activity Tests
  console.log('\n🎪 20. Activity Tests\n');
  
  test('GET /activity - Get activities', async () => {
    const res = await request('/api/activity');
    return {
      success: res.status === 200 && res.data.success,
      details: `Activities: ${res.data.data?.length || 0}`
    };
  });

  // 21. Market Tests
  console.log('\n🏪 21. Market Tests\n');
  
  test('GET /market - Get market items', async () => {
    const res = await request('/api/market');
    return {
      success: res.status === 200 && res.data.success,
      details: `Items: ${res.data.data?.length || 0}`
    };
  });

  // 22. Item Craft Tests
  console.log('\n🔨 22. Item Craft Tests\n');
  
  test('GET /item-craft - Get craft recipes', async () => {
    const res = await request('/api/item-craft');
    return {
      success: res.status === 200 && res.data.success,
      details: `Recipes: ${res.data.data?.length || 0}`
    };
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(50));

  return results;
}

// Export for use
module.exports = { runTests, request, test };

// Run if called directly
if (require.main === module) {
  runTests().then(() => process.exit(0));
}
