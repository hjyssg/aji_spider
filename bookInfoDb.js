const loki = require("lokijs");

// const util = global.requireUtil();
// const { isCompress } = util;

let loki_db;
let content_db;

// const _ = require('underscore');


module.exports.init = function(path){
    loki_db = new loki(path, {
        autoload: true,
        autoloadCallback : databaseInitialize,
        autosave: true, 
        autosaveInterval: 4000
    });
}

// implement the autoloadback referenced in loki constructor
function databaseInitialize() {
    content_db = loki_db.getCollection("bookInfo");
    if (content_db === null) {
    //   content_db = loki_db.addCollection("bookInfo", { indices: ['filePath'] });
      content_db = loki_db.addCollection("bookInfo");
    }
    var entryCount = content_db.count();
    console.log("[bookInfoDb] number of entries in database : " + entryCount);
}

// const has = module.exports.has = function(filePath){
//     const data = getData(filePath);
//     return !!data;
// }

// function getData(filePath){
//     return content_db && content_db.findOne({filePath: filePath});
// }

// //how many image files
// const getPageNum = module.exports.getPageNum = function(filePath){
//     if(has(filePath)){
//         const contentInfo = getData(filePath);
//         return +(contentInfo.pageNum) || 0;
//     }else{
//         return 0;
//     }
// }



// module.exports.getZipInfo = function(filePathes){
//     const fpToInfo = {};
    
//     filePathes.forEach(filePath => {
//         if(isCompress(filePath) && has(filePath)){
//             let pageNum = getPageNum(filePath);
//             const musicNum = getMusicNum(filePath);
//             const totalImgSize = getTotalImgSize(filePath);

//             const entry = {
//                 pageNum,
//                 musicNum,
//                 totalImgSize
//             }

//             fpToInfo[filePath] = entry;
//         }
//     }); 
//     return fpToInfo;
// }

// module.exports.deleteFromZipDb = function(filePath){
//     if(!content_db){
//         return;
//     }

//     if(has(filePath)){
//         let data = getData(filePath);
//         content_db.remove(data);
//     }
// }

// module.exports.updateZipDb = function(filePath, info){
//     if(!content_db){
//         return;
//     }

//     const { pageNum, musicNum, totalImgSize } = info;

//     //!!bug if shut the down the program, all data will be lost
//     if(has(filePath)){
//         let data = getData(filePath);
//         data.filePath = filePath;
//         data.pageNum = pageNum;
//         data.musicNum = musicNum;
//         data.totalImgSize = totalImgSize;
//         content_db.update(data);
//     }else{
//         content_db.insert({
//             filePath,
//             pageNum,
//             totalImgSize,
//             musicNum
//         });
//     }
// }

module.exports.insert = function(info){
    content_db.insert(info);
}