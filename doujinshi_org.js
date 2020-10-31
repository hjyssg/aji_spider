
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
let page;

const bookInfoDb = require("./bookInfoDb");
let db_path = "book_info";
bookInfoDb.init(db_path);


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
      return parseBookinfo(singleInfo);
    })

    bookinfo = bookinfo.filter(e => e.Type !== "Commercial Magazine");
  
    // console.log(bookinfo);
    // const title = await secPage.title();

    bookInfoDb.insert(bookinfo);
  }
}

function parseBookinfo(singleInfo){
  const obj = {};
  let lines = singleInfo.split("\n").map(e => e.trim()).filter(e => e.length > 0);
  let currentKey;

  const allowKeys = [
    "Romanized:",
    "Original:",
    "Circle:",
    "Author:",
    "Parodies:",
    "Type:",
    "Pages:",
    "Adult:",
    "Score:",
    "Date:",
    "Modified:",
  ];

  // 0:"Romanized:"
  // 1:"Original:"
  // 2:"if idol diary ~ことりサンタの贈りもの~"
  // 3:"Circle:"
  // 4:"Dai 6 Kichi / 第6基地"
  // 5:"Author:"
  // 6:"Kichirock / キチロク"
  // 7:"Parodies:"
  // 8:"Love Live! series"
  // 9:"Type:"
  // 10:"Doujinshi"
  // 11:"Pages: 4"
  // 12:"Adult: Yes"
  // 13:"Score:"
  // 14:"- (0)"
  // 15:"Date: 2015-12-31"
  // 16:"Modified: 2018-01-10"

  lines.forEach(e => {
    const isKey = e.endsWith(":") && allowKeys.includes(e);
    const isKeyValue = e.includes(": ");

    if(isKey){
      currentKey =  e.substring(0, e.length-1);
    }else if(isKeyValue){
      const tks = e.split(": ");
      if(tks.length === 2){
        obj[tks[0]] = tks[1];
      }
    } else if(currentKey){
      obj[currentKey] = e;
      currentKey = null;
    }
  });

  return obj;
}

async function searchOne(author){

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

  const noImg = (request) => {
      if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
          request.abort();
      } else {
          request.continue();
      }
  }

  //https://github.com/puppeteer/puppeteer/issues/1913 
  //do not load image/stylesheet
  page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', noImg);

  secPage = await browser.newPage();
  await secPage.setRequestInterception(true);
  secPage.on('request', noImg);

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