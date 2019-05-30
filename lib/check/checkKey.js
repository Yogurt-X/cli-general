const chalk = require('chalk');

const __log = console.log;

function getRegx_G(key) { 
    return new RegExp("\\/{0,2}\\s*" + key + ":\\s*\\'\\S*\\'", "g");
}

function checkKey(key, fileContent) {
    let regx = getRegx_G(key);
    let match = fileContent.match(regx);
    if (!match) {
        return false;
    }
    let matchValue = checkMatchList(match, key);
    if (matchValue) {
        return matchValue
    } else {
        return false;
    }
}

function checkMatchList(list, key) {
    let reg = new RegExp("\\/{1,2}\\s*" + key + ":\\s*\\'\\S*\\'", "g")
    try {
        let value = '';
        let __value = '';
        list.forEach(item => {
            if (item.match(reg)) {
                __value = item;
            } else if (value) {
                __log(chalk.red('检查到有重复的字段名, 请检查配置文件,project.config.js', key));
                process.exit();
            } else {
                value = item;
            }
        });
        if (value) {
            return value;
        }
        if (__value) {
            __log(chalk.red(`检测到有被注释掉的配置${key},没有其他可用配置, 请检查配置文件,project.config.js`));
            return '';
        }
    } catch (error) {
        console.log(error);
    }
}
module.exports = {
    checkKey,
    checkMatchList
}