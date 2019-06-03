const httpRequest = require('request');
const chalk = require('chalk');
const fs = require('fs');
const __app_config = require('./appConfig');
const __global_config = require('../globalData');
const { getOrganization } = require('../../utils/index');
const __log = console.log;

let ORGANIZATION = '';
let ENV = '';
function requestForHost(url) {
    return new Promise((r, j) => {
        httpRequest({
            method: 'get',
            url
        }, function (err, res, body) {
            if (err) {
                __log(chalk.red(err));
                return false;
            }
           
            if (body) {

                let data = JSON.parse(body).data;
                writeFile(`module.exports = ` + JSON.stringify(formatData(data), null, 4)).then(r);
            }

        });
    });

}
function checkDir(base, path) {
     let pathList = path.split('/');
    let basePath = base
     const check = function(path) {
         try {
            fs.statSync(path);
         } catch (error) {
            fs.mkdirSync(path);
         }
     }
     pathList.forEach(path => {
        basePath = basePath + '/' + path;
        check(basePath);
     });
     return basePath;
}
function writeFile(data) {
    let dirPath = checkDir(__app_config.root_path, `hostcenter/${ORGANIZATION}`);
    let writePath = `${dirPath}/${ENV}.js`;
    return new Promise((r, j) => {
        fs.writeFile(writePath, data, err => {
            if (err) {
                __log(chalk.red('err', err));
                return false;
            }
            __log(chalk.green(` 🚀   写入成功  业务域:${__global_config.organizationMap[ORGANIZATION]} 环境: ${__app_config.envDescMap[ENV]}' \n `));
            r();
        });
    });
}

function formatHttp(url) {
    return url.replace('https://', '//').replace('http://', '//');
}

function formatData(data) {
    if (!Array.isArray(data)) {
        __log(chalk.red('接口请求的host格式出错请联系后端开发...\n'));
        return false;
    }
    
    return data.reduce((result, host) => {
        result[host.key] = JSON.stringify(formatHttp(host.value));
        return result;
    }, {});
}

function appendParams(url, organization) {
    let { envMap, env, appMap } = __app_config;
    let { organizationMap } = __global_config;
    if (!envMap[ENV]) {
        __log(chalk.red('无效的发布环境.... 推荐值', Object.keys(envMap).join(',   '), '\n'));
    }
    if (!appMap[organization]) {
        __log(chalk.red('无效的发布域.... 推荐值', Object.keys(organizationMap).join(',   '), '\n'));
        __log(chalk.red('建议使用ck publish [发布域code] 来检查\n'));
        process.exit();
    }
    url += '?type=' + envMap[ENV];
    url += '&app=' + organization;
    url += '&token=' + appMap[organization].token;
    return url;
}

function __startHostCenter(organization, env) {
    // let organization = await getOrganization();
    ORGANIZATION = organization;
    ENV = env;
    let { baseUrl } = __app_config;
    if (!organization) {
        __log(chalk.red('无效的organization字段请检查', '\n'));
    }
    let requestUrl = appendParams(baseUrl, organization);
    return requestForHost(requestUrl);
}

module.exports = {
    __startHostCenter
}