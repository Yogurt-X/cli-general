const host = require('./host');
const { root_path, appMap } = require('./appConfig');
const organization = process.argv[2];
const envList = ['stable', 'prepub', 'prod'];
var orgMap = ['guanghui', 'single-unit', 'oushang'];

function checkOrganization() {
    if (organization) {
        if (!appMap[organization]) {
            console.error('无效的host域请检查, 推荐值', Object.keys(appMap).join('/'));
            process.exit();
            return false;
        }
        return [organization];
    } 
    return orgMap;
}

// 立刻执行
(async function __start() {
    let paramList = [];
    checkOrganization().forEach(org => {
        envList.forEach(env => {
            paramList.push({org, env});
        });
    });
    let startIndex = 0;
    const start = function() {
        let {org, env} = paramList[startIndex];
        host.__startHostCenter(org, env).then(res =>{
            if (startIndex < paramList.length -1) {
                startIndex ++ ;
                start();
            }
        });
    }
    start();
    console.log('hostcenter部署完成');
})();