
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const pfs = require('promise-fs');
const fs = require('fs');
const path = require('path');
const destPath = "./screenshots";

const visited = {};

async function main(){
    let mkerr = await pfs.mkdir(destPath, {recursive: true});
    if(mkerr){
      throw mkerr;
    }

    // That's it, the rest is puppeteer usage as normal 😊
    const browser = await puppeteer.launch({ headless: false })

    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600 })


    console.log(`begin..`)
    page.setDefaultTimeout(45*1000)

    // await page.waitForSelector(selector)
    page.setJavaScriptEnabled(false)
    const indexurl = 'https://www.vanityfair.com'
    await page.goto(indexurl);
    console.log("Read home page", indexurl);
    // await page.waitFor(1000)
    // await page.screenshot({ path: 'adblocker.png', fullPage: true })


    //下载图片
    //https://stackoverflow.com/questions/52542149/how-can-i-download-images-on-a-page-using-puppeteer
    //https://www.npmjs.com/package/image-downloader
    const tPage = await browser.newPage();
    let allImgs = await page.$$("img");
    for(let ii = 0; ii < allImgs.length; ii++){
      const subUrl = await allImgs[ii].evaluate(node => {
         //run in chrome
          return node.src;
      });


      var viewSource = await tPage.goto(subUrl);
      await tPage.waitForTimeout(1005);
      const err = await pfs.writeFile( "kk-"+ii+".png", await viewSource.buffer())
      if (err) {
          return console.log(err);
      }
    }



    //遍历具体页面
    let selector = ".feature-item-link"; //".item .movie-box"
    let allItems = await page.$$(selector);

    allItems = allItems || [];
    const secPage = await browser.newPage()
    for(let ii = 0; ii < allItems.length; ii++){
      const subUrl = await allItems[ii].evaluate(node => {
         //run in chrome
          return node.href;
      })

      if(visited[subUrl]){
        continue;
      }
      
      await secPage.goto(subUrl);
      visited[subUrl] = true;
      console.log(subUrl)

      await secPage.waitForTimeout(1005);

      const title = await secPage.title();
      // const imgPath = path.join(destPath, title +'.png');
      const imgPath = path.join(destPath, ii +'.png');
      await secPage.screenshot({ path: imgPath, fullPage: true })
    }

    await browser.close()
}

try{
  main();
}catch(e){
  debugger
  console.error(e)
}