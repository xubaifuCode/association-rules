const {preProcess, dataProcess} = require('./mining');
const wlxeData = require('./dataset/wlxe.json');
const aomenData = require('./dataset/aomen.json');
const bet365Data = require('./dataset/bet365.json');
const liboData = require('./dataset/libo.json');

const dataSet = {
  'wlxe': wlxeData,
  'aomen': aomenData,
  'bet365': bet365Data,
  'libo': liboData
};

const mapString = {
  '0': '负',
  '1': '平',
  '3': '胜',
};
const rateMapString = {
  '0': '胜',
  '1': '负',
  '2': '平'
};

function dataMining (trainData, threshold = 25) {
// 将预处理后的数据转为训练数据，即去除无关字段
  let preProcessResult = preProcess(trainData);
// 使用训练数据进行关联规则分析
  let processedData = preProcessResult.trainData;
  let processResult = dataProcess(processedData, processedData, 1, threshold);
  console.log(`关联规则如下，最低支持度${threshold}, 总数据量: ${trainData.length}条`);
  console.log(`胜支持度: ${processResult.supportAndConfidence['items|3'].support}, 平支持度: ${processResult.supportAndConfidence['items|1'].support}, 负支持度: ${processResult.supportAndConfidence['items|0'].support}`);
  let resultStr = processResult.resultData.reduce((pre, itemArr) => {
    let lineStr = itemArr.reduce((pre, cur) => {
      const indexArr = cur.split('|');
      let str = '';
      if (indexArr.length === 3) {
        const support = processResult.supportAndConfidence[itemArr.join(',')].support;
        const confidence = processResult.supportAndConfidence[itemArr.join(',')].confidence;
        str = `${rateMapString[indexArr[1] - 1]}率为: ${preProcessResult.items[indexArr[1] - 1][indexArr[2] - 1]}, 支持度:${support}, 置信度: ${confidence}%`;
      } else {
        str = `结果为：${mapString[indexArr[1]]}`;
      }
      return pre ? `${pre}, ${str}` : `${str}`;
    }, '');
    return pre ? `${pre}\n${lineStr}` : lineStr;
  }, '');
  console.log(resultStr);
}



/************** 程序开始的地方 **************/
Object.keys(dataSet).forEach(dataKey => {
  console.log(`========== 数据集: ${dataKey} =========`);
  console.log();

  const trainData = Object.keys(dataSet[dataKey]).reduce((pre, cur) => {
    return pre.concat(dataSet[dataKey][cur]);
  }, []);

  const winData = trainData.filter(dataItem => dataItem.result === 3);
  const lostData = trainData.filter(dataItem => dataItem.result === 0);
  const peaceData = trainData.filter(dataItem => dataItem.result === 1);
  const minLen = Math.min(Math.min(winData.length, lostData.length), peaceData.length);
  let data = [].concat(winData.splice(0, minLen)).concat(lostData.splice(0, minLen).concat(peaceData.splice(0, minLen)));

  dataMining(data, 60);
  console.log(`=======================================`);
});

