const path = require('path');

const baseUrl = 'http://config.souche-inc.com/app/config/keys.json';
const process_organization = process.argv[2];
const process_env = process.argv[3];
const root_path = process.cwd(); //工作目录
const project_config = path.resolve(root_path, './config');
const project_config_path = path.resolve(root_path, './config/project.config.js');
const build_prompt = path.resolve(root_path, './build/build-prompt.js');
const package_path = path.resolve(root_path, './package.json');
const package_name = require(package_path).name;

// ?app=guanghui&token=02Og2c7Ctq&type=test
const appMap = {
    'single-unit': {
        token: 'NN8oMicEa7',
        appId: 487
    },
    'guanghui': {
        token: '02Og2c7Ctq',
        appId: 396

    },
    'oushang': {
        token: 'AcqQTO9dxW',
        appId: 466

    },
    'infiniti': {
        token: 'jau6k2Wbld',
        appId: 398

    },
}

const envMap = {
    stable: 'dev',
    stable2: 'dev-b',
    prepub: 'prepub',
    prod: 'pro'
};

const envDescMap = {
    stable: '测试环境',
    stable2: '开发环境',
    prepub: '预发环境',
    prod: '生产环境'
}

function getConfigByOrganization(organization) {
    return Object.assign(__map[organization] || {}, {
        envId,
        callback
    });
}



module.exports = {
    appMap: appMap,
    baseUrl: baseUrl,
    getConfigByOrganization: getConfigByOrganization,
    process_organization,
    process_env,
    envMap,
    project_config,
    project_config_path,
    build_prompt,
    package_path,
    package_name,
    envDescMap,
    root_path
}