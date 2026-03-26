// 前端调试测试脚本
const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage();
  
  console.log('打开游戏页面...');
  await page.goto('http://localhost:5173/jxweb');
  await page.waitForTimeout(2000);
  
  // 监听console - 实时输出
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed')) {
      console.log('❌ 报错:', text);
    }
  });
  
  // 监听网络错误 - 实时输出
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('❌ 请求失败:', response.status(), response.url());
    }
  });
  
  console.log('✅ 页面已打开，开始测试！');
  console.log('点击功能后报错会实时显示...\n');
  
  // 保持运行
  while(true) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

test().catch(console.error);
