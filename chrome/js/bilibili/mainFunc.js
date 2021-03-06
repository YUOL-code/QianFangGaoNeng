/**
 * 根据 av 号获得视频的 cid
 * @param {Object} avObj av号及页码信息
 * @returns {String} 获取到的 cid
 */
function getCid(avObj) {
    var result = $.parseJSON($.ajax({
        url: '//www.bilibili.com/widget/getPageList?aid=' + avObj.avId,
        async: false,
    }).responseText)[avObj.pageNum - 1].cid;
    console.log(result);
    return result;
}

/**
 * 根据 cid 号获得弹幕的 XML 文档
 * @param {Object} cid 视频的 cid
 * @returns {String} 弹幕的 XML 文档
 */
function getDanmukuXML(cid) {
    var danmukuAddress = '//comment.bilibili.com/' + cid + '.xml';
    var danmukuXml = null;
    return danmukuXml = $.ajax({
        url: danmukuAddress,
        processData: false,
        cache: false,
        async: false,
    }).responseXML;
}

/**
 * 解析弹幕数据
 * @param {Object} danmukuXml 弹幕的 XML 文档
 * @returns {Array} 弹幕数据， time: 整数发送时间， content: 弹幕内容
 */
function parseDanmukuData(danmukuXml) {
    var danmukuData = [];
    $(danmukuXml).find('d').each(function () {
        var param = $(this).attr('p').split(',').map(function (str) {
            return parseInt(str);
        });
        if (param[5] === 0) {
            danmukuData.push({
                time: parseInt(param[0]),
                content: $(this).html()
            });
        }
    });
    return danmukuData;
}

/**
 * 更新弹幕数据
 * @param {Object} myChart 预留的 eCharts 对象
 * @param {Array} newDanmukuData （可选）弹幕数据，若此项为空，那么函数会从网络重新获得弹幕数据
 * @returns {Object} myChart 生成的eCharts 对象
 */
function updateDanmukuData(myChart, newDanmukuData, maxLength) {
    console.log(maxLength);
    if (!newDanmukuData) {
        var avObj = getAvObj();
        var cid = getCid(avObj);
        var danmukuXml = getDanmukuXML(cid);
        newDanmukuData = parseDanmukuData(danmukuXml);
    }
    var chartData = makeChartData(newDanmukuData, maxLength);
    refreshChartData(myChart, chartData, chartData.step);
    // var keyPoints = findKeyPoints(newDanmukuData, chartData.step, chartData.maxLength);
    return newDanmukuData;
}

// START

function startChart() {
    var $myChart = initEChartsDom($(containerSelector));
    var myChart = echarts.init($myChart[0]);
    myChart.danmuku = {};
    var danmukuData = null;
    getBiliPlayer(function (biliPlayerForControl) {
        danmukuData = updateDanmukuData(myChart, null, biliPlayerForControl.videoLength);
        addPlayerHook(myChart, biliPlayerForControl);
    }, function () {
        tellUpdate($myChart);
    });
    // danmukuData = updateDanmukuData(myChart, null);
    addEventListener('hashchange', function () {
        // updateDanmukuData(myChart, null);
        getBiliPlayer(function (biliPlayerForControl) {
            updateDanmukuData(myChart, null, biliPlayerForControl.videoLength);
            addPlayerHook(myChart, biliPlayerForControl);
        }, function () {
            tellUpdate($myChart);
        });
    })
}