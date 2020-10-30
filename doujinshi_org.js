
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin({ blockTrackers: true, cacheDir: "blockcache" }));

const pfs = require('promise-fs');
const path = require('path');
const screenshotPath = "./screenshots";
let browser;
const visited = {};
let secPage;


async function handleSingleAuthorPage(subUrl){
  if(visited[subUrl]){
    return;
  }

  await secPage.goto(subUrl);
  let pageButton = await secPage.$$(".header .pagination a");

  for(let ii = 0; ii < pageButton.length; ii++){
    if(ii > 0){
      await pageButton[ii].click()
      await secPage.waitForNavigation();
      pageButton = await secPage.$$(".header .pagination a");
    }

    visited[subUrl] = true;
    console.log(subUrl)
  
    await secPage.waitForTimeout(1005);
  
    let bookinfo = await secPage.$$eval(".bookinfo", nodeArr => {
      return nodeArr.map(e => e.textContent);
    })
  
    bookinfo = bookinfo.map(singleInfo => {
      return singleInfo.split("\n").map(e => e.trim()).join("\n");
    })
  
    console.log(bookinfo);
    // const title = await secPage.title();
  }
}

async function searchOne(author){
    const page = await browser.newPage();

    //搜索作者
    const url = "https://www.doujinshi.org/search/simple/?T=author&sn=" + author;
    await page.goto(url);
    
    //找出搜索结果
    let selector = "table tbody tr td:nth-child(2) a:nth-child(1)";
    let allUrls = await page.$$eval(selector, nodeArr => {
      return nodeArr.map(e => e.href);
    });

    allUrls = allUrls || [];
    for(let ii = 0; ii < allUrls.length; ii++){
      const subUrl = allUrls[ii];
      await handleSingleAuthorPage(subUrl);
    }
}

let author_list = [
  "キチロク"
];

async function main(){
  browser = await puppeteer.launch({ headless: false,
    args: [
      '--proxy-server=socks5://localhost:10808',
  ]});
  
  // let mkerr = await pfs.mkdir(screenshotPath, {recursive: true});
  // if(mkerr){
  //   throw mkerr;
  // }

  secPage = await browser.newPage()

  for(let ii = 0; ii < author_list.length; ii++){
    const author = author_list[ii];
    await searchOne(author);
  }
}


try{
  main();

  console.log("done");
}catch(e){
  debugger
  console.error(e)
}