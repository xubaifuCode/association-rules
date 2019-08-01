/**
 * 将参数转为一维数组
 * 如果参数是元素，返回一个只有一个元素的数组
 * 如果参数是数组，有三种情况
 *   1. 子元素都不是数组，则返回该数组
 *   2. 子元素全部是数组，将转为一维数组，如[[1,2],[3,4]] ==> [1,2,3,4]
 *   3. 子元素部分是数组，部分不是数组,也将转为一维度数组，如[1,2,[3,4,[5,6,[7,8]]],[9],10] ==> [1,2,3,4,5,6,7,8,9,10]
 * @param arr
 * @returns {*[]|*}
 */
function mArrayToOne (arr) {
  if (!Array.isArray(arr)) return [arr];
  return arr.reduce((pre, cur) => {
    // 当前元素不是数组
    if (!Array.isArray(cur)) {
      pre.push(cur);
    } else if (cur.length) {
      // 数组子元素是数组，且不为空
      for (let i = 0; i < cur.length; i++) {
        if (!Array.isArray(cur[i])) {
          pre.push(cur[i]);
        } else {
          pre = pre.concat(mArrayToOne(cur[i]));
        }
      }
    }
    return pre;
  }, []);
}

/**
 * 将数组按k进行全排列
 * @param arr 一维数组
 * @param k
 * @returns {*[]|Array}
 */
function kFullArray (arr, k) {
  arr = [...new Set(arr)];
  function produceFullArray (n, k, rawSet) {
    if (k === 1) {
      for (let i = n; i >= 0; i--) {
        selectedArr.push(rawSet[i]);
        resultArr.push([...selectedArr]);
        selectedArr.splice(selectedArr.findIndex(item => item === rawSet[i]), 1);
      }
    }
    if (k > 1) {
      for (let i = n; i >= k - 1; i--) {
        selectedArr.push(rawSet[i]);
        produceFullArray(i - 1, k - 1, rawSet, selectedArr);
        selectedArr.splice(selectedArr.findIndex(item => item === rawSet[i]), 1);
      }
    }
  }

  if (arr.length < k) {
    return [arr];
  }
  const resultArr = [];
  const selectedArr = [];
  produceFullArray(arr.length - 1, k, arr);

  return resultArr;
}

function checkIfItemsInArray (arr, targetArr) {
  const cache = arr.reduce((pre, cur) => {
    pre[cur] = true;
    return pre;
  }, {});
  for (let i = 0; i < targetArr.length; i++) {
    if (cache[targetArr[i]] !== true) {
      return false;
    }
  }
  return true;
}

function outputResult (processResult, desc='频繁项集') {
  console.log(`================= ${desc} ====================`);
  console.log(processResult);
  console.log(`================= ${desc} ====================`);
}

module.exports = {
  mArrayToOne,
  kFullArray,
  checkIfItemsInArray,
  outputResult
};
