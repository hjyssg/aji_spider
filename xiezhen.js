
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());


async function waitForUseManuallyLogin(page){
  console.log(" 用户自己手动登陆");
  // 弄完在console输出下面这行
  await page.waitForFunction(() => {
    return document.ready_to_continue === "1";
  }, {
    timeout: 2*60*1000
  });
  console.log("手动登陆结束");
}

async function main(){
    const browser = await puppeteer.launch({ headless: false});

    const page = await browser.newPage();
    const LOGIN_URL = 'http://www.ouxiangxiezhen.com/yun/buyVoucher?id=143626';
    await page.goto(LOGIN_URL);
    await waitForUseManuallyLogin(page);
    
    let page2 = await browser.newPage();
    for(let ii = 140000; ii < 20*10000; ii++){
      try{
        console.log(ii);
        await page2.goto("http://www.ouxiangxiezhen.com/yun/buyVoucher?id="+ii);
        await page2.screenshot({path: ii+'.png'});
      }catch(e){
        console.error(e)
      }
    }
}


try{
  main();
}catch(e){
  console.error(e)
}
