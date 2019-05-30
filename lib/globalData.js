const path = require('path');
const root_path = process.cwd(); //工作目录
const project_config_path = path.resolve(root_path, './config/project.config.js');
const build_prompt = path.resolve(root_path, './build/build-prompt.js');
const package_path = path.resolve(root_path, './package.json');
const package_name = require(package_path).name;

const organizationMap = {
    'guanghui': '广汇',
    'single-unit': '单店集团版',
    'infiniti': '英菲',
    'oushang': '欧尚'
}

const originMap = {
    'guanghui': {
        stable: 'f2e.gh.dasouche.net',
        prepub: 'f2e.prepub.cgacar.com',
        prod: 'f2e.cgacar.com'
    },
    'single-unit': {
        stable: 'f2e.su.dasouche.net',
        prepub: 'f2e.prepub.miaomaicar.com',
        prod: 'f2e.miaomaicar.com'
    },
    'infiniti': {
        stable: 'f2e.yf.dasouche.net',
        prepub: 'f2e.prepub.dongfenginfiniti.com.cn',
        prod: 'f2e.dongfenginfiniti.com.cn'
    },
    'oushang': {
        stable: 'f2e.os.dasouche.net',
        prepub: 'f2e.prepub.skeyou.com',
        prod: 'f2e.prepub.skeyou.com'
    }
}
module.exports = {
    rootPath: root_path, //项目地址 即命令执行目录地址
    project_config_path: project_config_path, // 项目project.config.js地址
    build_prompt: build_prompt, // 项目build-prompt.js地址 npm run build 命令执行的文件
    package_path: package_path, // 项目package.json地址
    package_name: package_name, // 项目package.json名称
    organizationMap, // 4种域名
    originMap // 4个域名的测试预发线上地址
}