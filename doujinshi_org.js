
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin({ blockTrackers: true, cacheDir: "blockcache" }));
const fs = require('fs');


const pfs = require('promise-fs');
const path = require('path');
let browser;
const visited = {};
let secPage;
let page;

const bookInfoDb = require("./bookInfoDb");
let db_path = "book_info.json";
bookInfoDb.init(db_path);

async function handleSingleAuthorPage(subUrl){
  if(visited[subUrl]){
    return;
  }

  await secPage.goto(subUrl);
  let pageLinks = await secPage.$$eval(".header .pagination a", nodeArr => {
    return nodeArr.map(e => e.href);
  });
  console.log("check ", subUrl)
  visited[subUrl] = true;

  //网页始终有pagina的样子
  //手动点击 pagination的ui会改变 很不好爬
  for(let ii = 0; ii < pageLinks.length; ii++){
    if(ii > 0){
      // await pageButton[ii].click()
      // await secPage.waitForNavigation();
      // pageButton = await secPage.$$(".header .pagination a");
      
      await secPage.goto(pageLinks[ii])
    }

    console.log(ii, "/", pageLinks.length);

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

async function searchWithOneAuthor(author){
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

let author_list =  fs.readFileSync("keys.txt").toString().split('\n'); 

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

  let ii = 14; // 0;
  for(; ii < author_list.length; ii++){
    try{
      const author = author_list[ii];
      console.log("begin:", author, ii)
      await searchWithOneAuthor(author);
      console.log("finish:", author)
    }catch(e){
      debugger
      console.error(e)
    }
  }
  console.log("done");
}


  main();

  
