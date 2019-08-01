const {mArrayToOne, kFullArray, checkIfItemsInArray} = require('./utils');
/***
 * 数据预处理 得到trainData，用于关联规则算法
 * ***/
/**
 * 数据预处理，将胜率离散化防止重复
 *
 * 第一步：利用三维数组存储去重后的概率
 *     第一维存储 去重后的 主队获胜的概率
 *     第二维存储 去重后的 结果为平的概率
 *     第三维存储 去重后的 客队获胜的概率
 *
 * 第二步：根据三维数组中概率所在位置生成映射关系
 *     如[ [23, 22], [32], [45, 46]]
 *     映射关系为[所在维度 + 概率]:`items[$(所在维度+1)$(所在位置+1)]`
 *     23 ==> { "023":"items11" }
 *     32 ==> { "032":"items22" }
 *
 * 第三步：生成关联规则可用数据，将原始数据中的概率以及结果离散化，其中结果的0、1、3映射为items0,items1,items3
 * @param raceData
 * @returns {Uint8Array | BigInt64Array | {result: *, guest_win: *, num, draw: *, host_win: *}[] | Float64Array | Int8Array | Float32Array | Int32Array | Uint32Array | Uint8ClampedArray | BigUint64Array | Int16Array | Uint16Array}
 */
const preProcess = (raceData) => {
  const items = [];
  for (let i = 0; i < 3; i++) {
    items[i] = [];
  }
  // 去重保存三种维度的概率
  raceData.forEach(raceItem => {
    if (!items[0].includes(raceItem['host_win'])) {
      items[0].push(raceItem['host_win']);
    }
    if (!items[1].includes(raceItem['draw'])) {
      items[1].push(raceItem['draw']);
    }
    if (!items[2].includes(raceItem['guest_win'])) {
      items[2].push(raceItem['guest_win']);
    }
  });

  // 生成映射关系
  const numToStringMapping = {};
  items.reduce((pre, cur, curIndex) => {
    cur.forEach((item, index) => {
      pre[`${curIndex}${item}`] = `items|${curIndex + 1}|${index + 1}`;
    });
    return pre;
  }, numToStringMapping);

  numToStringMapping['0'] = 'items|0';
  numToStringMapping['1'] = 'items|1';
  numToStringMapping['3'] = 'items|3';

  // 原始数据离散化
  const processedData = raceData.map((item) => {
    return {
      "raw_host_win": item.host_win,
      "raw_guest_win": item.guest_win,
      "raw_draw": item.draw,
      "raw_result": item.result,
      "host_win": numToStringMapping[`0${item.host_win}`],
      "guest_win": numToStringMapping[`2${item.guest_win}`],
      "draw": numToStringMapping[`1${item.draw}`],
      "result": numToStringMapping[item.result]
    };
  });
  return {
    processedData,
    trainData: processedData.map(item => {
      return [
        item.host_win,
        item.guest_win,
        item.draw,
        item.result
      ];
    }),
    items
  }
};
/**
 * 使用Apriori算法的数据挖掘过程
 * @param trainData 原始数据集，用于寻找支持度
 * @param fixData 产生的频繁项集
 * @param k 排列组合的个数 如五5个按每2个排列则k=2
 * @param threshold 最低支持度
 */

// 存储上一轮支持度
let preCountResultMap = {};
// 存储首次计算比赛结果的支持度
let supportAndConfidenceCountMap = {};
const dataProcess = (trainData, fixData, k, threshold) => {
  // 将训练数据转为一维数组、去重、然后按k进行全排列
  const fullArrayData = kFullArray(mArrayToOne(fixData), k);
  // 存储本轮支持度
  const countResultMap = {};
  for (let i = 0; i < fullArrayData.length; i++) {
    for (let j = 0; j < trainData.length; j++) {
      if (checkIfItemsInArray(trainData[j], fullArrayData[i])) {
        const key = fullArrayData[i].join(',');
        countResultMap[key] = (countResultMap[key] || 0) + 1;
      }
    }
  }

  if (countResultMap['items|1']) {
    supportAndConfidenceCountMap = {
      'items|1': {
        support: countResultMap['items|1']
      },
      'items|0': {
        support: countResultMap['items|0']
      },
      'items|3': {
        support: countResultMap['items|3']
      }
    };
  }

  // 剔除小于阈值的数组
  const nextTrainData = Object.keys(countResultMap)
      .filter(itemKey => countResultMap[itemKey] >= threshold)
      .map(item => item.split(','));

  if (nextTrainData.length && nextTrainData.length > 1) {
    preCountResultMap = countResultMap;
    return dataProcess(trainData, nextTrainData, k + 1, threshold);
  } else {
    // 计算支持度和置信度
    let resultData;
    let countCache;
    if (nextTrainData.length === 1) {
      resultData = nextTrainData[0];
      countCache = countResultMap;
    } else {
      resultData = fixData;
      countCache = preCountResultMap;
    }
    resultData.forEach(itemArr => {
      const target = itemArr.find(itemKey => /^items\|[1|0|3]$/.test(itemKey));
      const currentKeySupport = countCache[itemArr.join(',')];
      const currentKeyConfidence = (currentKeySupport / (supportAndConfidenceCountMap[target].support || 1) * 100).toFixed(2);
      supportAndConfidenceCountMap[itemArr.join(',')] = {
        support: currentKeySupport,
        confidence: currentKeyConfidence
      }
    });
    // console.log(supportAndConfidenceCountMap);
    // console.log(resultData);
    return {
      resultData,
      supportAndConfidence: supportAndConfidenceCountMap
    };
  }
};

module.exports = {
  preProcess,
  dataProcess
};
