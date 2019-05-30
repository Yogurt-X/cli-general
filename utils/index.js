const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');
const app_config = require('../lib/hostcenter/appConfig');
const global_config = require('../lib/globalData');
const {checkKey} = require('../lib/check/checkKey');

/**
 * 定义organization 入参规则
 * 1.从命令里面捞
 * 2.从project.config里面捞
 * 3.没有的话就枚举让用户选择
 */
async function getOrganization() {
    console.log(chalk.green('开始从process中获取...'))
    try {
        let _org = getOrganizationFromProcess();
        if (!_org) {
            console.log(chalk.green('从process中获取失败...'))
            console.log(chalk.green('开始检查project.config.js...'))
            _org = await getOrganizationFromProject();
            if (_org) {
                console.log(chalk.green('获取organization成功'));
            }
        }
        if (_org) {
            return Promise.resolve(_org);
        }
    } catch (error) {
        if (typeof error === 'string') {
            switch (error) {
                case ERR_NO_ORGANIZATION:
                    console.log(chalk.green('检查project.config.js失败...'));
                    return getOrganizationFrominquirer();
                    break;
            
                default:
                    break;
            }
        }
        console.log('error', error);
    }
}

function getOrganizationFromProcess() {
    return app_config.process_organization;
}

function getEnvFromProcess() {
    return app_config.process_env;
}

function getOrganizationFromProject() {
    return new Promise((resolve, reject) => {
        let { project_config_path } = app_config;
        fs.readFile(project_config_path, (err, res) => {
            if (err) {
                console.log(chalk.red('获取配置文件失败, 请检查是不是走错地方了'));
                process.exit();
                return false;
            }
            let __projectConfig = res.toString();
            let regx = /organization\s*:\s*'\S*'/;
            let valueRegx = /'\S*'/;
            //TODO: 这个地方需要判断有没有有效的organization
            let checkStatus = checkKey('organization', __projectConfig);
            if (checkStatus) {
                resolve(checkStatus.match(valueRegx)[0].split("'").join(''))
            } else {
                reject(ERR_NO_ORGANIZATION);
            }
        });

    });
}

function getOrganizationFrominquirer() {
    let orgMap = Object.keys(global_config.organizationMap);
    return inquirer.prompt([{
        name: 'organization',
        message: '请选择你要发布的域',
        type: 'list',
        default: orgMap[0],
        choices: orgMap
    }]).then(function (answers) {
        if (answers.organization) {
            return answers.organization;
        }
    });
}

module.exports = {
    getOrganization,
    getEnvFromProcess
}