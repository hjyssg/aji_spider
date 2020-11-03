
// THIS FILE is ABANDONED 
// It is way easier to download images by writing a temper monkey script than writing a crawler


const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin({ blockTrackers: true, cacheDir: "blockcache" }));

// const fs = require('fs');
// const PuppeteerBlocker = require('@cliqz/adblocker-puppeteer').PuppeteerBlocker;
// const blocker = PuppeteerBlocker.parse(fs.readFileSync('F:\\aji_spider\\easylist.txt', 'utf-8'));

const pfs = require('promise-fs');

const path = require('path');
const destPath = "./screenshots";

const visited = {};

const LOGIN_URL = 'https://twitter.com/login';

async function login(page){
  await page.setViewport({ width: 800, height: 600 })

  console.log(`begin..`)
  page.setDefaultTimeout(30*1000)

  await page.goto(LOGIN_URL);
  // console.log("Read home page");

  let username = "sdsadsad";
  let password = "sadsad";
  //https://github.com/MahmudulHassan5809/Twitter-Web-Scraping-Using-Puppeteer/blob/master/twitter.js
  await page.waitFor('form input[name="session[username_or_email]"]');
  await page.type('form input[name="session[username_or_email]"]',username,{delay: 25});
  await page.type('form input[name="session[password]"]',password,{delay: 25});

  await page.click('div[role="button"]');
  await page.waitFor(2010);
}

async function waitForUseManuallyLogin(page){
  console.log(" 用户自己手动登陆");
  // 弄完在console输出下面这行
  // document.ready_to_continue = "1"
  await page.waitForFunction(() => {
    return document.ready_to_continue === "1";
  }, {
    timeout: 2*60*1000
  });
  console.log("手动登陆结束");
}

async function main(){
    let mkerr = await pfs.mkdir(destPath, {recursive: true});
    if(mkerr){
      throw mkerr;
    }

    //有bug就是说明明没有指定firefox
    //但却硬要用firefox
    //node_modules整个删除才行

    // That's it, the rest is puppeteer usage as normal 😊
    const browser = await puppeteer.launch({ headless: false,
      // product: "chrome",
      args: [
        '--proxy-server=socks5://localhost:10808',
    ]});

    // const browser = await puppeteer.launch({ headless: false});

    // const page = await browser.newPage();
    // login(page);
  
    // await page.waitFor('.public-DraftStyleDefault-block');
    
    let page2 = await browser.newPage();
    // blocker.enableBlockingInPage(page2)
    // await page2.goto("https://twitter.com/potus?lang=en");
    await page2.goto("https://twitter.com/Strangestone/media");

    // await waitForUseManuallyLogin(page2);

  await downloadAllImg(page2, browser);
}

const downloadedLink = {};

async function downloadAllImg(page, browser){
  const imgpage = await browser.newPage();

  let index = 0;
  while(index < 100){
    index++;

    const obj = await page.evaluate(() => {

      let result = [];
      document.querySelectorAll("article").forEach(article => {
        //e.g 水洗卜イレ@suisentoire·2時間鬼滅の刃最終回ネタバレ
        let spans = Array.from(article.querySelectorAll("span span"));
        let author;
        for(let ii = 0; ii < spans.length; ii++){
          let e1 = spans[ii];
          let e2 = e1.parentElement.parentElement.parentElement.parentElement;
          if(e2.textContent.includes("@")){
            author = e2.textContent;
            break;
          }
        }
        if(!author){
          return;
        }
        // console.log(author);  
        const imgs = article.querySelectorAll("img");
        if(imgs.length > 1) {
          imgs.forEach((img, index) => {
            if(index === 0){
              //todo
              //the first one is icon
              return;
            }

            const link = img.src;
            result.push({
              author,
              link
            });
          });
        }
      })

      return result;
    });

    // visitedLink

    // console.log(obj);

    for(let ii = 0; ii < obj.length; ii++){
        const info = obj[ii];
        const { link, author} = info;

        if(downloadedLink[link]){
          continue;
        }

        //todo
        let _link = link;
        let dest = author + " -- " + link;
        //todo
        //https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#Browser_compatibility
        const segment = link.substring(link.lastIndexOf('/') + 1);
        const fn = ii+".jpg"// segment
         
        try{
          //todo
          // https://stackoverflow.com/questions/52542149/how-can-i-download-images-on-a-page-using-puppeteer
          var viewSource = await await imgpage.goto(_link);

          const err = await pfs.writeFile(fn, await viewSource.buffer())
          if(err){
            throw err;
          }
          downloadedLink[link] = true;
        }catch(err){
          console.error(err)
        }
    }

    await page.mouse.wheel({ deltaY: 500 })
    await page.waitForTimeout(2010);
  }
}

try{
  main();
}catch(e){
  debugger
  console.error(e)
}
