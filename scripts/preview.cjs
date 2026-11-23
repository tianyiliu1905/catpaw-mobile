#!/usr/bin/env node
/* Local network preview: serve a folder, show a QR code, and reload on changes. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { parseArgs } = require('node:util');
const browserSync = require('browser-sync').create();
const QRCode = require('qrcode');
const { renderDashboard } = require('./preview-ui.cjs');

function networkAddresses() {
  return Object.entries(os.networkInterfaces())
    .filter(([name]) => !/^(utun|tun|tap|docker|veth|vmnet|vbox|awdl|llw)/i.test(name))
    .flatMap(([name, entries]) => entries.filter(item => item.family === 'IPv4' && !item.internal && !item.address.startsWith('169.254.')).map(item => ({ name, address:item.address })))
    .sort((a,b) => Number(b.name === 'en0') - Number(a.name === 'en0'));
}
function htmlPages(root, prefix = '', depth = 0) {
  if (depth > 5) return [];
  const excluded = new Set(['node_modules','vendor','assets','scripts']);
  return fs.readdirSync(path.join(root,prefix),{withFileTypes:true}).flatMap(item => {
    if (item.name.startsWith('.') || item.isSymbolicLink()) return [];
    const relative = path.posix.join(prefix,item.name);
    if (item.isDirectory()) return excluded.has(item.name) ? [] : htmlPages(root,relative,depth+1);
    return /\.html?$/i.test(item.name) ? [relative] : [];
  }).sort();
}
function availablePort(port) {
  return new Promise((resolve,reject) => {
    const probe = net.createServer();
    probe.once('error',reject);
    probe.listen(port,'0.0.0.0',() => probe.close(resolve));
  });
}
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals:true,
    options:{ port:{type:'string',default:process.env.PREVIEW_PORT || '5174'}, host:{type:'string'}, entry:{type:'string',default:'index.html'}, help:{type:'boolean',short:'h'} },
  });
  if (values.help) {
    console.log('用法：npm run preview -- [HTML 文件夹] [--port 5174] [--entry index.html] [--host 局域网IP]');
    return;
  }
  const root = path.resolve(positionals[0] || process.cwd());
  if (!fs.statSync(root).isDirectory()) throw new Error('请选择包含 HTML 的文件夹。');
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('端口应为 1024–65535 之间的整数。');
  const pages = htmlPages(root);
  if (!pages.length) throw new Error('这个文件夹内没有找到 HTML 文件。');
  const entry = values.entry.replaceAll('\\','/');
  if (!pages.includes(entry)) throw new Error(`找不到 ${entry}，可使用 --entry 指定：${pages.join('、')}`);
  const addresses = networkAddresses();
  if (values.host) {
    if (!addresses.some(item => item.address === values.host)) throw new Error('--host 必须是本机的局域网 IPv4 地址。');
    addresses.sort((a,b) => Number(b.address === values.host) - Number(a.address === values.host));
  }
  try { await availablePort(port); }
  catch (error) { if (error.code === 'EADDRINUSE') throw new Error(`端口 ${port} 已占用，可使用 --port 指定其他端口。`); throw error; }
  const local = `http://127.0.0.1:${port}`;
  const pagePath = page => '/' + page.split('/').map(encodeURIComponent).join('/');
  const phoneURL = (host,page) => `http://${host}:${port}${pagePath(page)}`;
  const middleware = async (req,res,next) => {
    res.setHeader('Cache-Control','no-store');
    const url = new URL(req.url,local);
    if (/^\/(?:\.git|\.codex|\.agents|node_modules|scripts)(?:\/|$)/.test(url.pathname) || /\/(?:package(?:-lock)?\.json|\.env(?:\.[^/]*)?)$/.test(url.pathname)) {
      res.writeHead(404);res.end('Not found');return;
    }
    if (url.pathname !== '/__preview/' && url.pathname !== '/__preview/qr.svg') { next();return; }
    const currentPages = htmlPages(root);
    const currentAddresses = networkAddresses();
    if (values.host) currentAddresses.sort((a,b) => Number(b.address === values.host) - Number(a.address === values.host));
    const requestedPage = url.searchParams.get('page');
    const page = currentPages.includes(requestedPage) ? requestedPage : entry;
    const host = currentAddresses.some(item=>item.address === url.searchParams.get('host')) ? url.searchParams.get('host') : currentAddresses[0]?.address;
    const target = host ? phoneURL(host,page) : '';
    try {
      if (url.pathname.endsWith('/qr.svg')) {
        if (!target) {res.writeHead(503);res.end('No local network');return;}
        res.setHeader('Content-Type','image/svg+xml');
        res.end(await QRCode.toString(target,{type:'svg',width:248,margin:2,errorCorrectionLevel:'M'}));
      } else {
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.end(renderDashboard({root,port,addresses:currentAddresses,pages:currentPages,page,host,target}));
      }
    } catch (error) {res.writeHead(500);res.end('预览页面生成失败');console.error(error.message);}
  };
  await new Promise((resolve,reject) => browserSync.init({
    server:{ baseDir:root, index:entry, directory:false, serveStaticOptions:{dotfiles:'deny'} },
    listen:'0.0.0.0',port,open:false,ui:false,online:false,
    notify:false,ghostMode:false,logLevel:'silent',middleware:[middleware],
    files:[path.join(root,'**/*.{html,css,js,svg,png,jpg,jpeg,webp,gif}')],
    watchOptions:{ignoreInitial:true,ignored:['**/node_modules/**','**/.git/**','**/scripts/**']},
    reloadDebounce:200,
  }, error => error ? reject(error) : resolve()));
  console.log(`\n手机预览已启动\n\n扫码面板：${local}/__preview/\n电脑预览：${local}${pagePath(entry)}\n目录：${root}`);
  if (addresses.length) {
    console.log(`\n手机地址：${phoneURL(addresses[0].address,entry)}\n手机与电脑连接同一 Wi-Fi，扫码打开：\n`);
    console.log(await QRCode.toString(phoneURL(addresses[0].address,entry),{type:'terminal',small:true}));
  } else console.log('\n未发现局域网地址。连接 Wi-Fi 后重新启动即可生成手机二维码。');
  console.log('保存 HTML、CSS、JS 后自动更新；按 Ctrl+C 停止。\n');
  let stopping = false;
  const stop = () => { if (stopping)return;stopping=true;browserSync.exit();process.exit(0); };
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
main().catch(error => { console.error(`预览启动失败：${error.message}`);browserSync.exit();process.exitCode=1; });
