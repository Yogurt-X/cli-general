const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { envDescMap } = require('./hostcenter/appConfig');
const globalData = require('./globalData');
const { getOrganization, getEnvFromProcess } = require('../utils/index');
const { checkMatchList } = require('./check/checkKey'); 

// 需要检查project.config.js中的字段
const checkKey = [
    'organization',
    'serverRelativePath',
    'publishSourceFolder'
];

// 四种域名
const organizationMap = globalData.organizationMap;

const inquirerConfig = {
    organization: {
        name: 'organization',
        message: '请选择要修改的环境',
        type: 'list',
        default: Object.keys(organizationMap)[0],
        choices: Object.keys(organizationMap)
    },
    serverRelativePath: {
        name: 'serverRelativePath',
        message: '请输入你要访问的文件名',
        type: 'input',
        default: globalData.package_name
    },
    publishSourceFolder: {
        name: 'publishSourceFolder',
        message: '请输入你要发布的文件夹地址',
        type: 'input',
        default: 'dist'
    }
}
const ERROR_INSERT = 'insert';
const ERROR_UPDATE = 'update';

const __log = console.log;
var cache_project_config_text = '';
var cache_error_key = []; //缓存报错的字段名
var cache_error_codeMap = {}; //缓存报错的字段名的code
var _computed_inquirer_config = []; //根据报错字段来控制配置
var cache_organization = '';
var cache_env = '';
const checkKeyMap = {
    organization: '',
    serverRelativePath:'',
    publishSourceFolder: ''
};

const checkPublishEnv = async function checkPublishEnv() {
    __log(chalk.green('开始检查project.config.js..\n'));
    let { project_config_path } = globalData;

    cache_env = getEnvFromProcess();
    // if(!organization){
        // 如果没有传organization，就从project.config.js中获取
    let organization = await getOrganization();
    // }
    /**因为统一工作台不需要这个字段，但是为了统一命令，和在选择的时候给予提示，命令阶段使用inc 内部转成INC */
    /**
     * 检查定向organization知否符合配置
     */
    if (organization && !organizationMap[organization]) {
        console.error('查询的业务不存在,推荐值:', Object.keys(organizationMap).join(','));
        return false;
    }
    cache_organization = organization;
    let errorKey = [];

    var __projectConfig = fs.readFileSync(project_config_path).toString();
    cache_project_config_text = __projectConfig;

    try {
        /**开始检查需要校验的字段 */
        checkKey.forEach((res, index) => {
            /**
             * 在拼接正则的时候原有的\S这些需要转义成\\S 保证解析之后是\S
             */
            let regx = appendRegx(res);
            /**校验字段是否存在 */
            if (!regx.test(__projectConfig)) {
                errorKey.push({
                    key: res,
                    msg: `project.config.js字段校验失败, 缺少${res}`,
                    code: ERROR_INSERT
                });
                return false;
            }
            let matchList = Array.from(__projectConfig.split('\n').join('').match(regx));
            let visibleMath = checkMatchList(matchList, res);
            if (!visibleMath) {
                errorKey.push({
                    key: res,
                    msg: `project.config.js字段${res}校验失败, 没有匹配到有效配置, ${JSON.stringify(organizationMap)}`,
                    code: ERROR_INSERT
                });
                return false;
            }
            let matchValue = visibleMath.match(/\'\S*\'/)[0].split("'").join('');
            saveCheckValue(res, matchValue);
            if (res === 'organization') {
                /**校验project.config.js中的organization是否符合格式 */
                if (!organizationMap[matchValue]) {
                    errorKey.push({
                        key: res,
                        msg: `project.config.js字段organization校验失败, 值不符合标准, ${JSON.stringify(organizationMap)}`,
                        code: ERROR_UPDATE,
                        value: matchValue,
                        matchRow: visibleMath
                    });
                    return false;
                }
                /**如果是定向检查 */
                if (matchValue !== organization) {
                    errorKey.push({
                        key: res,
                        msg: '检测到当前配置不是所要检查的业务',
                        code: ERROR_UPDATE,
                        value: matchValue,
                        matchRow: visibleMath
                    });
                    return false;
                }
            }
        });
        if (errorKey.length > 0) {
            throw errorKey;
        }
        console.log('project.config文件校验成功');
        logSuccess();
    } catch (error) {
        if (Array.isArray(error)) {
            __log(chalk.red('检查失败~~'));
            __log('    ');

            error.map(err => {
                __log(chalk.red('失败字段', err.key));
                __log(chalk.red('原因', err.msg));
                __log(chalk.red('   '));
            });
            askForRepair(error, organization);
        }
    }
}

// 拼接正则规则
function appendRegx(key) {
    return new RegExp("\\/{0,2}\\s*" + key + ":\\s*\\'\\S*\\'", "g");
}

// 询问是否自动化修复
function askForRepair(error, organization) {
    inquirer.prompt([{
        name: 'visibleForRepair',
        message: '是否要启动自动化修复',
        type: 'list',
        default: 'yes',
        choices: ['no', 'yes']
    }]).then(function (answers) {
        if (answers.visibleForRepair === 'yes') {
            repairConfig(error, organization);
        }
        __log(chalk.green('校验结束'));
    });
}

// 保存键值对
function saveCheckValue(key, value) {
    checkKeyMap[key] = value;
}

// 进行自动化修复
function repairConfig(errorList) {
    errorList.forEach(err => {
       cache_error_key.push(err.key);
        cache_error_codeMap[err.key] = err;
        _computed_inquirer_config.push(inquirerConfig[err.key]);
   });
   askForEndConfig(_computed_inquirer_config);
}

function askForEndConfig(config) {
    console.log('askForEndConfig');
    if (cache_organization) {
        let l = config.length;
        config = config.filter(conf => conf.name !== 'organization');
        let _l = config.length;
        l > _l && insertValue('organization', cache_organization, cache_error_codeMap.organization);
    }
    config.length > 0 && inquirer.prompt(config).then(function (answers) {
        __log(chalk.green('正在帮您修改数据.....'));
        cache_error_key.map(key => {
            insertValue(key, answers[key], cache_error_codeMap[key]);
        });
    });
}

var needInsert = [];
let insertTimeout = null;
/**
 * 
 * @param {*} key 需要修改的字段名
 */
function insertValue(key, value, err) {
    console.log('err', err, 'key', key);
    if (!err || !err.code) {
        __log('不知道的错误字段类型', code, key);
        process.exit();
    }
    const pushNeedInsert = function(params) {
        if (insertTimeout) {
            clearTimeout(insertTimeout);
        }
        needInsert.push({
            key, value
        });
        insertTimeout = setTimeout(() => {
            insertNewValue(needInsert);
        }, 2000);
    }
    switch (err.code) {
        case ERROR_INSERT:
            pushNeedInsert();
            break;
        case ERROR_UPDATE:
            update(value, err.value, err.matchRow);
            saveCheckValue(key, value);
        default:
            break;
    }
}

function update(newValue, oldValue, matchRow) {
    __log(chalk.green('正在帮您修改字段...'));
    __log(chalk.green('   '));
    //有的话用正则筛选出来要修改的，然后用新值来替换
     let __file_content = cache_project_config_text;
    __matchValue = matchRow.replace(oldValue, newValue);
    __file_content = __file_content.replace(matchRow, __matchValue);
    writeFile(__file_content);
}

function insertNewValue(needInsert) {
    __log(chalk.green('正在帮您添加没有的字段...'));
    __log(chalk.green('   '));
    let textList = cache_project_config_text.split('\n');
    let length = textList.length - 1;
    /**
     * 找出闭合括号的index
     */
    let addIndex = -1;
    for (let i = length; i >= 0; i--) {
        let _text = textList[i];
        if (_text.indexOf('}') >= 0) {
            addIndex = i - 1;
            break;
        }
    }
    if (addIndex < 0) {
        console.log('文件格式不对，找不到对象的闭合括弧');
        return false;
    }
    /**
     * 检验插入数据的前面一行有没有逗号
     */
    let beforeInsertText = textList[addIndex - 1];
    let regx = /\s*\S*:\s*\S*/;
    if (regx.test(beforeInsertText)) {
        if (beforeInsertText.indexOf(',') < 0) {
            let matchtext = beforeInsertText.match(regx)[0];
            textList[addIndex - 1] = beforeInsertText.replace(matchtext, `${matchtext},`);
        }
    }
    /**
     * 开始插入数据
     */
    let endText = textList.splice(addIndex, length);
    let _needLength = needInsert.length;
    needInsert.forEach((item, index) => {
        textList.push(`    ${item.key}: '${item.value}'${index < _needLength ? ',' : ''}`);
        saveCheckValue(item.key, item.value);
    });
    textList = textList.concat(endText);
    let newProjectConfig = textList.join('\n');
    writeFile(newProjectConfig);
}

function writeFile(text) {
    fs.writeFile(globalData.project_config_path, text, (err) => {
        logSuccess();
        console.log('🚀 🚀 🚀  恭喜你修改成功, 修改成功, 可以愉快的用sw publish 来发布了 \n');
    });
}


function logSuccess() {
    let hasEnv = !!cache_env;
    cache_env = cache_env || 'stable';
    try {
        __log(chalk.green(`
            校验结果:         🚀  检查成功,
            当前发布域code:   ${cache_organization},
            发布域名称:       ${organizationMap[cache_organization]},
            当前发布路径:      serverRelativePath:  ${checkKeyMap.serverRelativePath},
            当前发布文件夹:    publishSourceFolder:  ${checkKeyMap.publishSourceFolder}
            当前环境:         ${hasEnv ? `已检测到当前环境是: ${envDescMap[cache_env]} `:'未检测到环境 默认为测试环境'}
            访问路径为:       ${globalData.originMap[cache_organization][cache_env]}/${checkKeyMap.serverRelativePath}/index.html
        `));
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    checkPublishEnv: checkPublishEnv
}