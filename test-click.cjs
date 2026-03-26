// 自动点击测试
const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage();
  
  console.log('打开页面...');
  await page.goto('http://localhost:5173/jxweb');
  await page.waitForTimeout(3000);
  
  // 截个图看看初始状态
  await page.screenshot({ path: 'screenshot1.png' });
  console.log('截图1已保存');
  
  // 尝试点击各个按钮
  const buttons = await page.$$('a, button, li');
  console.log(`找到 ${buttons.length} 个可点击元素`);
  
  for (let i = 0; i < Math.min(10, buttons.length); i++) {
    try {
      const text = await buttons[i].textContent();
      if (text && text.trim()) {
        console.log(`点击 ${i}: ${text.trim().substring(0, 30)}`);
        await buttons[i].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `screenshot${i+2}.png` });
      }
    } catch(e) {}
  }
  
  console.log('测试完成，截图已保存');
  await browser.close();
}

test().catch(e => console.error(e));
