- 启动
npm run start
访问https://localhost:81/videocall.html

- 移动端访问媒体需要https访问
server.js下增加key和crt

- 地址需要指定
let connOption = { host: '192.168.0.108', port: 9000, path: '/', debug: 3 };

若访问出现net::ERR_CERT_AUTHORITY_INVALID，则在NetWork下访问地址，【高级】仍然访问后，回到原地址刷新
https://192.168.0.108:9000/peerjs/50/95aodueqp9/id?i=0
- 需先register后执行call

ref:https://cloud.tencent.com/developer/article/1505076