// Function to deep copy a 2D array
function deepCopy2DArray(arr) {
    return arr.map(subArr => {return{...subArr}});
}

function multiplyDict(dict, multiplyBy){
    const res = {}
    for(let key in dict){
        res[key] = dict[key]*multiplyBy
    }
    return res
}

// function calcDictDiff(dict1, dict2){
//     let res = 0;
//     for(let key in dict1){
//         res += Math.abs(dict1[key] - dict2[key])
//     }
//     return res
// }

function addDict(dict1, dict2){
    let res = {};
    for(let key in dict1){
        res[key] = dict1[key] + dict2[key]
    }
    return res
}

function calcDistance(dict1,dict2){
    let res = 0;
    for(let key in dict1){
        if(key!='id' && key!='name'){
            res += (dict1[key] - dict2[key])**2
        }
    }
    return res == 0 ? 0.001 : res
}

module.exports = {
    deepCopy2DArray,
    multiplyDict,
    // calcDictDiff,
    addDict,
    calcDistance
}